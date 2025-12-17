use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use anyhow::Context;
use axum::{
    body::Body,
    extract::{Multipart, Path as AxumPath, State},
    extract::multipart::MultipartRejection,
    http::{header, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;
use tower::ServiceExt;
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::{error, info};

#[derive(Clone)]
struct AppState {
    base_dir: PathBuf,
    static_dir: PathBuf,
    next_share_id: Arc<AtomicU64>,
    shares: Arc<Mutex<HashMap<u64, ShareEntry>>>,
    jobs: Arc<Mutex<HashMap<String, ReceiveJob>>>,
}

struct ShareEntry {
    upload_dir: PathBuf,
    send_result: sendme::SendResult,
    _status: Arc<Mutex<JobStatus>>,
}

struct ReceiveJob {
    _out_dir: PathBuf,
    zip_path: PathBuf,
    status: Arc<Mutex<JobStatus>>,
}

#[derive(Clone, Debug, Default)]
struct JobStatus {
    state: String,
    bytes: Option<u64>,
    total: Option<u64>,
    speed_bps: Option<f64>,
    message: Option<String>,
}

#[derive(Serialize)]
struct SendResponse {
    #[serde(rename = "shareId")]
    share_id: u64,
    ticket: String,
}

#[derive(Deserialize)]
struct ReceiveRequest {
    ticket: String,
}

#[derive(Serialize)]
struct ReceiveStartResponse {
    #[serde(rename = "jobId")]
    job_id: String,
}

#[derive(Serialize)]
struct ReceiveStatusResponse {
    state: String,
    bytes: Option<u64>,
    total: Option<u64>,
    #[serde(rename = "speedBps")]
    speed_bps: Option<f64>,
    message: Option<String>,
}

#[derive(Clone)]
enum EmitterKind {
    Share,
    ReceiveJob,
}

#[derive(Clone)]
struct StatusEmitter {
    kind: EmitterKind,
    status: Arc<Mutex<JobStatus>>,
}

impl sendme::EventEmitter for StatusEmitter {
    fn emit_event(&self, event_name: &str) -> Result<(), String> {
        let mut status = self
            .status
            .lock()
            .map_err(|_| "status lock poisoned".to_string())?;
        match (&self.kind, event_name) {
            (EmitterKind::Share, "transfer-started") => status.state = "running".to_string(),
            (EmitterKind::Share, "transfer-completed") => status.state = "done".to_string(),
            (EmitterKind::Share, "transfer-failed") => status.state = "error".to_string(),
            (EmitterKind::ReceiveJob, "receive-started") => status.state = "running".to_string(),
            (EmitterKind::ReceiveJob, "receive-completed") => status.state = "done".to_string(),
            _ => {}
        }
        Ok(())
    }

    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String> {
        if event_name != "transfer-progress" && event_name != "receive-progress" {
            return Ok(());
        }
        let Some((bytes, total, speed_bps)) = parse_progress_payload(payload) else {
            return Ok(());
        };
        let mut status = self
            .status
            .lock()
            .map_err(|_| "status lock poisoned".to_string())?;
        status.bytes = Some(bytes);
        status.total = Some(total);
        status.speed_bps = Some(speed_bps);
        Ok(())
    }
}

fn parse_progress_payload(payload: &str) -> Option<(u64, u64, f64)> {
    let parts: Vec<&str> = payload.split(':').collect();
    if parts.len() != 3 {
        return None;
    }
    let bytes = parts[0].parse::<u64>().ok()?;
    let total = parts[1].parse::<u64>().ok()?;
    let speed_int = parts[2].parse::<i64>().ok()?;
    Some((bytes, total, speed_int as f64 / 1000.0))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "altsendme_web_server=info,tower_http=info".into()),
        )
        .init();

    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    let static_dir =
        std::env::var("STATIC_DIR").unwrap_or_else(|_| "web-server/static".to_string());
    let base_dir = std::env::var("DATA_DIR").unwrap_or_else(|_| "web-server/data".to_string());

    let base_dir = PathBuf::from(base_dir);
    tokio::fs::create_dir_all(&base_dir)
        .await
        .context("create DATA_DIR")?;
    let base_dir = tokio::fs::canonicalize(&base_dir)
        .await
        .context("canonicalize DATA_DIR")?;

    let state = AppState {
        base_dir,
        static_dir: PathBuf::from(&static_dir),
        next_share_id: Arc::new(AtomicU64::new(1)),
        shares: Arc::new(Mutex::new(HashMap::new())),
        jobs: Arc::new(Mutex::new(HashMap::new())),
    };

    let api = Router::new()
        .route("/send", post(api_send))
        .route("/send/:id/stop", post(api_send_stop))
        .route("/receive", post(api_receive_start))
        .route("/receive/:id/status", get(api_receive_status))
        .route("/receive/:id/download", get(api_receive_download))
        .route("/health", get(api_health));

    let app = Router::new()
        .nest("/api", api)
        .fallback(spa_fallback)
        .with_state(state.clone())
        .layer(TraceLayer::new_for_http());

    let listener = TcpListener::bind(&bind_addr)
        .await
        .with_context(|| format!("bind {bind_addr}"))?;
    info!("listening on http://{bind_addr}");
    info!("static dir: {}", state.static_dir.display());

    axum::serve(listener, app).await?;
    Ok(())
}

async fn spa_fallback(State(state): State<AppState>, req: axum::extract::Request) -> Response {
    let static_dir = state.static_dir;
    let serve_dir = ServeDir::new(&static_dir)
        .not_found_service(ServeFile::new(static_dir.join("index.html")));

    match serve_dir.oneshot(req).await {
        Ok(res) => res.into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    }
}

async fn api_health() -> impl IntoResponse {
    StatusCode::NO_CONTENT
}

async fn api_send(
    State(state): State<AppState>,
    multipart: Result<Multipart, MultipartRejection>,
) -> Result<Json<SendResponse>, AppError> {
    let mut multipart = match multipart {
        Ok(m) => m,
        Err(e) => {
            return Err(AppError::bad_request(format!(
                "invalid multipart request: {e}. Use multipart/form-data with field name 'file'."
            )));
        }
    };

    let mut temp_path: Option<PathBuf> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::bad_request(e.to_string()))?
    {
        if field.name() != Some("file") {
            continue;
        }
        let file_name = field
            .file_name()
            .map(sanitize_filename)
            .unwrap_or_else(|| "file".to_string());

        let share_id = state.next_share_id.fetch_add(1, Ordering::Relaxed);
        let upload_dir = state.base_dir.join("send").join(share_id.to_string());
        tokio::fs::create_dir_all(&upload_dir)
            .await
            .context("create upload dir")
            .map_err(|e| AppError::internal(e.to_string()))?;

        let file_path = upload_dir.join(
            &file_name,
        );

        let mut outfile = tokio::fs::File::create(&file_path)
            .await
            .with_context(|| format!("create upload file {}", file_path.display()))
            .map_err(|e| AppError::internal(e.to_string()))?;

        let mut field = field;
        while let Some(chunk) = field
            .chunk()
            .await
            .map_err(|e| AppError::bad_request(e.to_string()))?
        {
            outfile
                .write_all(&chunk)
                .await
                .with_context(|| format!("write upload chunk {}", file_path.display()))
                .map_err(|e| AppError::internal(e.to_string()))?;
        }

        temp_path = Some(file_path);
        // We already allocated an id for the share while streaming upload.
        // Store it in message payload via temp_path; we'll reuse share_id later.
        // Note: this handler returns share_id after start_share completes, so we need it.
        // We encode it into the file path parent (upload_dir name).
        break;
    }

    let file_path = temp_path.ok_or_else(|| {
        AppError::bad_request("missing file. Use multipart/form-data with field name 'file'.")
    })?;
    let upload_dir = file_path
        .parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| AppError::internal("upload directory missing"))?;
    let share_id = upload_dir
        .file_name()
        .and_then(|s| s.to_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::internal("failed to derive share id"))?;

    let status = Arc::new(Mutex::new(JobStatus {
        state: "queued".to_string(),
        ..Default::default()
    }));
    let app_handle: sendme::AppHandle = Some(Arc::new(StatusEmitter {
        kind: EmitterKind::Share,
        status: status.clone(),
    }));

    let options = sendme::SendOptions {
        relay_mode: sendme::RelayModeOption::Default,
        ticket_type: sendme::AddrInfoOptions::RelayAndAddresses,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let send_result = sendme::start_share(file_path, options, app_handle)
        .await
        .context("start_share")
        .map_err(|e| AppError::internal(e.to_string()))?;
    let ticket = send_result.ticket.clone();

    {
        let mut shares = state
            .shares
            .lock()
            .map_err(|_| AppError::internal("share lock poisoned"))?;
        shares.insert(
            share_id,
            ShareEntry {
                upload_dir,
                send_result,
                _status: status,
            },
        );
    }

    Ok(Json(SendResponse { share_id, ticket }))
}

async fn api_send_stop(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<u64>,
) -> Result<StatusCode, AppError> {
    let entry = {
        let mut shares = state
            .shares
            .lock()
            .map_err(|_| AppError::internal("share lock poisoned"))?;
        shares.remove(&id)
    };

    let Some(entry) = entry else {
        return Ok(StatusCode::NO_CONTENT);
    };

    let blobs_dir = entry.send_result.blobs_data_dir.clone();
    let router = entry.send_result.router;
    let upload_dir = entry.upload_dir;

    match tokio::time::timeout(Duration::from_secs(2), router.shutdown()).await {
        Ok(Ok(())) => {}
        Ok(Err(e)) => error!("router shutdown error: {e}"),
        Err(_) => error!("router shutdown timeout after 2 seconds"),
    }

    if let Err(e) = tokio::fs::remove_dir_all(&blobs_dir).await {
        error!("failed to clean blobs dir {}: {e}", blobs_dir.display());
    }
    if let Err(e) = tokio::fs::remove_dir_all(&upload_dir).await {
        error!("failed to clean upload dir {}: {e}", upload_dir.display());
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn api_receive_start(
    State(state): State<AppState>,
    Json(req): Json<ReceiveRequest>,
) -> Result<Json<ReceiveStartResponse>, AppError> {
    if req.ticket.trim().is_empty() {
        return Err(AppError::bad_request("ticket is empty"));
    }

    let job_id = uuid::Uuid::new_v4().to_string();
    let job_dir = state.base_dir.join("receive").join(&job_id);
    let out_dir = job_dir.join("out");
    let zip_path = job_dir.join("download.zip");

    tokio::fs::create_dir_all(&out_dir)
        .await
        .context("create receive out dir")
        .map_err(|e| AppError::internal(e.to_string()))?;

    let status = Arc::new(Mutex::new(JobStatus {
        state: "queued".to_string(),
        ..Default::default()
    }));

    {
        let mut jobs = state
            .jobs
            .lock()
            .map_err(|_| AppError::internal("job lock poisoned"))?;
        jobs.insert(
            job_id.clone(),
            ReceiveJob {
                _out_dir: out_dir.clone(),
                zip_path: zip_path.clone(),
                status: status.clone(),
            },
        );
    }

    let ticket = req.ticket;
    tokio::spawn(async move {
        {
            if let Ok(mut s) = status.lock() {
                s.state = "running".to_string();
            }
        }

        let app_handle: sendme::AppHandle = Some(Arc::new(StatusEmitter {
            kind: EmitterKind::ReceiveJob,
            status: status.clone(),
        }));
        let options = sendme::ReceiveOptions {
            output_dir: Some(out_dir.clone()),
            relay_mode: sendme::RelayModeOption::Default,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        match sendme::download(ticket, options, app_handle).await {
            Ok(result) => {
                if let Err(e) = create_zip_from_dir(&out_dir, &zip_path).await {
                    error!("zip create error: {e:?}");
                    if let Ok(mut s) = status.lock() {
                        s.state = "error".to_string();
                        s.message = Some(format!("zip failed: {e}"));
                    }
                    return;
                }

                if let Ok(mut s) = status.lock() {
                    s.state = "done".to_string();
                    s.message = Some(result.message);
                }
            }
            Err(e) => {
                error!("receive job failed: {e:?}");
                if let Ok(mut s) = status.lock() {
                    s.state = "error".to_string();
                    s.message = Some(e.to_string());
                }
            }
        }
    });

    Ok(Json(ReceiveStartResponse { job_id }))
}

async fn api_receive_status(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
) -> Result<Json<ReceiveStatusResponse>, AppError> {
    let job = {
        let jobs = state
            .jobs
            .lock()
            .map_err(|_| AppError::internal("job lock poisoned"))?;
        let Some(job) = jobs.get(&id) else {
            return Err(AppError::not_found("job not found"));
        };
        let s = job
            .status
            .lock()
            .map_err(|_| AppError::internal("status lock poisoned"))?
            .clone();
        ReceiveStatusResponse {
            state: s.state,
            bytes: s.bytes,
            total: s.total,
            speed_bps: s.speed_bps,
            message: s.message,
        }
    };

    Ok(Json(job))
}

async fn api_receive_download(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
) -> Result<Response, AppError> {
    let (zip_path, status) = {
        let jobs = state
            .jobs
            .lock()
            .map_err(|_| AppError::internal("job lock poisoned"))?;
        let Some(job) = jobs.get(&id) else {
            return Err(AppError::not_found("job not found"));
        };
        let s = job
            .status
            .lock()
            .map_err(|_| AppError::internal("status lock poisoned"))?
            .clone();
        (job.zip_path.clone(), s)
    };

    if status.state != "done" {
        return Err(AppError::bad_request("job not completed"));
    }

    let file = tokio::fs::File::open(&zip_path)
        .await
        .with_context(|| format!("open zip {}", zip_path.display()))
        .map_err(|e| AppError::not_found(e.to_string()))?;
    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);

    let mut res = Response::new(body);
    *res.status_mut() = StatusCode::OK;
    res.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/zip"),
    );
    res.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"altsendme-{id}.zip\""))
            .unwrap_or_else(|_| HeaderValue::from_static("attachment")),
    );
    Ok(res)
}

async fn create_zip_from_dir(dir: &Path, zip_path: &Path) -> anyhow::Result<()> {
    let dir = dir.to_path_buf();
    let zip_path = zip_path.to_path_buf();
    tokio::task::spawn_blocking(move || create_zip_from_dir_blocking(&dir, &zip_path))
        .await
        .context("join zip task")??;
    Ok(())
}

fn create_zip_from_dir_blocking(dir: &Path, zip_path: &Path) -> anyhow::Result<()> {
    use zip::write::FileOptions;
    use zip::ZipWriter;

    let file = std::fs::File::create(zip_path).context("create zip")?;
    let mut zip = ZipWriter::new(file);

    let options: FileOptions<'_, ()> = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    for entry in walkdir::WalkDir::new(dir).into_iter() {
        let entry = entry?;
        if entry.file_type().is_dir() {
            continue;
        }
        let path = entry.path();
        let rel = path
            .strip_prefix(dir)
            .context("strip prefix")?
            .to_string_lossy()
            .replace('\\', "/");
        zip.start_file(rel, options)?;
        let mut f = std::fs::File::open(path).with_context(|| format!("open {}", path.display()))?;
        std::io::copy(&mut f, &mut zip)?;
    }

    zip.finish()?;
    Ok(())
}

fn sanitize_filename(name: &str) -> String {
    let base = name
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or("file")
        .trim();
    let cleaned = base
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-' { c } else { '_' })
        .collect::<String>();
    if cleaned.is_empty() {
        "file".to_string()
    } else {
        cleaned
    }
}

#[derive(Debug)]
struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    fn bad_request(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: msg.into(),
        }
    }

    fn not_found(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: msg.into(),
        }
    }

    fn internal(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: msg.into(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = Json(serde_json::json!({ "error": self.message }));
        (self.status, body).into_response()
    }
}
