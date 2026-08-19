//! Opt-in diagnostic logging ("debug mode").
//!
//! Verbosity is decided **once at startup** and never reconfigured while running.
//! That is deliberate: it removes the reload layer, means the file sink is either
//! constructed or not (never swapped), and lets log cleanup run before any appender
//! exists — deleting an open file fails on Windows.
//!
//! The marker file is the single source of truth, mirroring `is_windows_portable`.
//! Toggling it takes effect on the next launch.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::layer::SubscriberExt as _;
use tracing_subscriber::util::SubscriberInitExt as _;
use tracing_subscriber::{fmt, EnvFilter, Layer as _};

/// Presence of this file in the app config dir enables debug logging on next launch.
const MARKER_FILE: &str = "debug-logging";

const LOG_PREFIX: &str = "dashbeam-";
const LOG_SUFFIX: &str = ".log";

/// Size of one log file before rolling to a fresh one. Idle control-plane traffic alone
/// is roughly 1.5 MB/day, so this is well under a day of history per file.
const MAX_FILE_BYTES: u64 = 1024 * 1024;
/// Total budget across all retained files.
const MAX_DIR_BYTES: u64 = 4 * 1024 * 1024;
/// How many files to keep, oldest discarded first.
const MAX_SESSION_FILES: usize = 3;

/// Debug mode switches itself off after this long. Someone who enables it to chase one
/// bug should not still be recording IP addresses and file names months later.
const MAX_ENABLED_AGE_SECS: u64 = 7 * 24 * 60 * 60;

/// Targeted rather than a blanket `debug`, which would drown the file in iroh internals.
///
/// Note these are *lib target* names, not package names: `sendme-protocol` builds lib
/// `protocol` and `sendme-native` builds lib `native`, and tracing targets follow the
/// lib name.
const DEBUG_FILTER: &str = "iroh::_events=debug,protocol=debug,native=debug,engine=debug,\
     dashbeam=debug,dashbeam_lib=debug";

/// Keeps the non-blocking writer's worker thread alive for the process lifetime.
/// Dropping this silently discards buffered lines.
static GUARD: OnceLock<WorkerGuard> = OnceLock::new();
/// Whether the file sink was actually installed for *this* run.
static ACTIVE: AtomicBool = AtomicBool::new(false);
/// Path of this session's log file, if any.
static SESSION_FILE: OnceLock<PathBuf> = OnceLock::new();

/// True when debug logging is writing to disk in this process.
pub fn is_active() -> bool {
    ACTIVE.load(Ordering::Relaxed)
}

/// This session's log file, if debug logging is active.
pub fn session_file() -> Option<&'static Path> {
    SESSION_FILE.get().map(PathBuf::as_path)
}

pub fn marker_path(config_dir: &Path) -> PathBuf {
    config_dir.join(MARKER_FILE)
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default()
}

/// When debug logging was switched on, if it is on.
///
/// Returns `None` for a marker written by an older build, which held no timestamp; such
/// a marker counts as enabled and simply never expires.
pub fn enabled_since(config_dir: &Path) -> Option<u64> {
    fs::read_to_string(marker_path(config_dir))
        .ok()?
        .trim()
        .parse()
        .ok()
}

fn is_expired(since: u64) -> bool {
    now_secs().saturating_sub(since) > MAX_ENABLED_AGE_SECS
}

/// Whether debug logging is enabled for the *next* launch.
pub fn is_enabled(config_dir: &Path) -> bool {
    if !marker_path(config_dir).exists() {
        return false;
    }
    enabled_since(config_dir).is_none_or(|since| !is_expired(since))
}

/// Enable or disable debug logging from the next launch onwards.
///
/// The marker stores the moment it was enabled so the toggle can expire on its own.
pub fn set_enabled(config_dir: &Path, enabled: bool) -> io::Result<()> {
    let marker = marker_path(config_dir);
    if enabled {
        fs::create_dir_all(config_dir)?;
        fs::write(&marker, now_secs().to_string())
    } else {
        match fs::remove_file(&marker) {
            Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(()),
            other => other,
        }
    }
}

/// Stdout-only subscriber, used when the app directories cannot be resolved.
///
/// Without this, a failure to resolve those paths would leave the process with **no**
/// subscriber at all — silencing logging entirely, which is worse than the behaviour
/// before debug mode existed.
pub fn init_stdout_only() {
    let _ = tracing_subscriber::registry()
        .with(
            fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_line_number(true)
                .with_filter(
                    EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
                ),
        )
        .try_init();
}

/// Install the global subscriber. Call exactly once, as early as a log dir is known.
///
/// Never panics and never blocks startup: any failure degrades to stdout-only logging.
/// `try_init` is used rather than `init` because the entry point is reachable from both
/// the desktop binary and the mobile library.
pub fn init(config_dir: &Path, log_dir: &Path) {
    let stdout_layer = fmt::layer()
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .with_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")));

    let enabled = is_enabled(config_dir);

    // An expired marker is cleared here, so the toggle reads as off from now on.
    if !enabled && marker_path(config_dir).exists() {
        let _ = set_enabled(config_dir, false);
    }

    // Runs before any appender exists, so there is never an open handle to unlink.
    if let Err(error) = prune(log_dir, enabled) {
        eprintln!("debug logging: could not prune old logs: {error}");
    }

    let file_layer = if enabled {
        match RollingWriter::new(log_dir.to_path_buf(), MAX_FILE_BYTES) {
            Ok((writer, path)) => {
                let (non_blocking, guard) = tracing_appender::non_blocking(writer);
                let _ = GUARD.set(guard);
                let _ = SESSION_FILE.set(path);
                ACTIVE.store(true, Ordering::Relaxed);
                Some(
                    fmt::layer()
                        .with_writer(non_blocking)
                        .with_ansi(false)
                        .with_target(true)
                        .with_thread_ids(true)
                        .with_line_number(true)
                        .with_filter(EnvFilter::new(DEBUG_FILTER)),
                )
            }
            Err(error) => {
                eprintln!("debug logging: could not open log file: {error}");
                None
            }
        }
    } else {
        None
    };

    // `Option<Layer>` is itself a Layer; `None` short-circuits, so with debug mode off
    // there is no file handle and no I/O.
    if tracing_subscriber::registry()
        .with(stdout_layer)
        .with(file_layer)
        .try_init()
        .is_err()
    {
        // Already initialised (e.g. a test harness). Not fatal.
        return;
    }

    if is_active() {
        tracing::debug!(
            target: "dashbeam::_events::debug_mode",
            file = ?session_file(),
            "debug logging active"
        );
    }
}

/// Nanosecond stamp so a rollover cannot collide with the file it just closed.
fn create_log_file(log_dir: &Path) -> io::Result<(fs::File, PathBuf)> {
    fs::create_dir_all(log_dir)?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    let path = log_dir.join(format!("{LOG_PREFIX}{stamp}{LOG_SUFFIX}"));
    let file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)?;
    Ok((file, path))
}

fn is_log_file(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .is_some_and(|n| n.starts_with(LOG_PREFIX) && n.ends_with(LOG_SUFFIX))
}

/// Collect session logs, newest first.
fn session_logs(log_dir: &Path) -> io::Result<Vec<(PathBuf, u64)>> {
    let mut files: Vec<(PathBuf, u64, SystemTime)> = Vec::new();
    let entries = match fs::read_dir(log_dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(e),
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !is_log_file(&path) {
            continue;
        }
        let meta = entry.metadata()?;
        let modified = meta.modified().unwrap_or(UNIX_EPOCH);
        files.push((path, meta.len(), modified));
    }
    files.sort_by(|a, b| b.2.cmp(&a.2));
    Ok(files.into_iter().map(|(p, len, _)| (p, len)).collect())
}

/// Delete everything when disabled; otherwise keep the newest files within both caps.
fn prune(log_dir: &Path, enabled: bool) -> io::Result<()> {
    let files = session_logs(log_dir)?;
    if !enabled {
        for (path, _) in files {
            let _ = fs::remove_file(path);
        }
        return Ok(());
    }

    let mut total = 0u64;
    for (index, (path, len)) in files.into_iter().enumerate() {
        total = total.saturating_add(len);
        if index >= MAX_SESSION_FILES || total > MAX_DIR_BYTES {
            let _ = fs::remove_file(path);
        }
    }
    Ok(())
}

/// Remove every session log, including the current one where the OS allows it.
pub fn clear(log_dir: &Path) -> io::Result<()> {
    for (path, _) in session_logs(log_dir)? {
        // The active file is still open on Windows; it is removed at next startup.
        let _ = fs::remove_file(path);
    }
    Ok(())
}

/// Concatenated session logs, newest last, truncated to `max_bytes` keeping the tail.
pub fn read_logs(log_dir: &Path, max_bytes: usize) -> io::Result<String> {
    let mut files = session_logs(log_dir)?;
    files.reverse(); // oldest first, so the newest lines end up at the tail
    let mut out = String::new();
    for (path, _) in files {
        if let Ok(text) = fs::read_to_string(&path) {
            out.push_str(&text);
        }
    }
    if out.len() > max_bytes {
        // Keep the most recent output and start at a line boundary.
        let cut = out.len() - max_bytes;
        let start = out[cut..].find('\n').map_or(cut, |i| cut + i + 1);
        out = format!("[… {cut} earlier bytes truncated …]\n{}", &out[start..]);
    }
    Ok(out)
}

/// Rolls to a fresh file at the cap, keeping the **most recent** output.
///
/// Simply stopping at the cap would preserve the oldest output instead, which is
/// backwards for diagnostics: enable debug mode on Monday, hit the bug on Friday, and
/// the log would be full of Monday with Friday never recorded.
struct RollingWriter {
    dir: PathBuf,
    file: fs::File,
    written: u64,
    cap: u64,
}

impl RollingWriter {
    fn new(dir: PathBuf, cap: u64) -> io::Result<(Self, PathBuf)> {
        let (file, path) = create_log_file(&dir)?;
        Ok((
            Self {
                dir,
                file,
                written: 0,
                cap,
            },
            path,
        ))
    }

    fn roll(&mut self) -> io::Result<()> {
        let (file, _) = create_log_file(&self.dir)?;
        self.file = file;
        self.written = 0;
        // Reclaim older files now; startup pruning alone would let a long-running
        // session grow without bound.
        let _ = prune(&self.dir, true);
        Ok(())
    }
}

impl Write for RollingWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        // `self.written > 0` guarantees progress even if a single line exceeds the cap.
        if self.written > 0 && self.written.saturating_add(buf.len() as u64) > self.cap {
            self.roll()?;
        }
        let n = self.file.write(buf)?;
        self.written = self.written.saturating_add(n as u64);
        Ok(n)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.file.flush()
    }
}

#[cfg(test)]
mod filter_tests {
    use super::DEBUG_FILTER;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;
    use tracing_subscriber::layer::{Context, SubscriberExt as _};
    use tracing_subscriber::{EnvFilter, Layer};

    /// Counts events that survive the filter.
    struct Hits(Arc<AtomicUsize>);

    impl<S: tracing::Subscriber> Layer<S> for Hits {
        fn on_event(&self, _event: &tracing::Event<'_>, _ctx: Context<'_, S>) {
            self.0.fetch_add(1, Ordering::Relaxed);
        }
    }

    /// Emits at each target and asserts it reached the layer. The target must be
    /// a literal because `tracing` builds a `static` callsite from it, which is
    /// why this is a macro rather than a loop over a slice.
    macro_rules! assert_admitted {
        ($hits:expr, $($target:literal),+ $(,)?) => {
            $({
                let before = $hits.load(Ordering::Relaxed);
                tracing::debug!(target: $target, "filter probe");
                assert!(
                    $hits.load(Ordering::Relaxed) > before,
                    "DEBUG_FILTER drops {}",
                    $target,
                );
            })+
        };
    }

    /// The filter is the single point of failure between an instrumented code path
    /// and the log file a user attaches to a bug report: a target it drops is
    /// silently invisible, with nothing at the call site to show it.
    #[test]
    fn debug_filter_admits_every_diagnostic_target() {
        let hits = Arc::new(AtomicUsize::new(0));
        let subscriber = tracing_subscriber::registry()
            .with(Hits(hits.clone()).with_filter(EnvFilter::new(DEBUG_FILTER)));

        tracing::subscriber::with_default(subscriber, || {
            assert_admitted!(
                hits,
                // Pairing.
                "dashbeam::_events::pairing::host_open",
                "dashbeam::_events::pairing::join_attempt",
                "dashbeam::_events::pairing::join_failed",
                "dashbeam::_events::pairing::invite_sent",
                "dashbeam::_events::pairing::invite_response",
                "dashbeam::_events::pairing::forget",
                // Nearby / mDNS.
                "dashbeam::_events::nearby::mdns_advertising",
                "dashbeam::_events::nearby::mdns_discovered",
                "dashbeam::_events::nearby::mdns_expired",
                "dashbeam::_events::nearby::mdns_unavailable",
                "dashbeam::_events::nearby::observe",
                "dashbeam::_events::nearby::identity",
                "dashbeam::_events::nearby::expire",
                "dashbeam::_events::nearby::probe_started",
                "dashbeam::_events::nearby::probe_failed",
                "dashbeam::_events::nearby::discoverability",
                // Control plane, shared by pairing and nearby.
                "dashbeam::_events::control::msg_in",
                "dashbeam::_events::control::msg_out",
            );
        });
    }
}
