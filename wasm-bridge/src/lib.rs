//! WASM bridge: wasm-bindgen exports over `wasm-io` + `protocol`.

use wasm_io::{
    download_files, fetch_metadata, start_share_bytes, start_share_items_bytes,
    AddrInfoOptions, AppHandle, EventEmitter, FileMetadata, ReceiveOptions, RelayModeOption,
    SendOptions, WasmReceiveResult, WasmShareSession,
};
use protocol::{
    get_relay_status as engine_get_relay_status, resolve_relay_mode_with_fallback,
    set_wasm_secret_key, verify_relays as engine_verify_relays, with_system_ca_if_custom,
    RelayConfigArg,
};
use std::str::FromStr;
use std::sync::{Arc, Mutex, OnceLock};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

struct JsEventEmitter {
    callback: js_sys::Function,
}

impl EventEmitter for JsEventEmitter {
    fn emit_event(&self, event_name: &str) -> Result<(), String> {
        self.callback
            .call2(
                &JsValue::NULL,
                &JsValue::from_str(event_name),
                &JsValue::NULL,
            )
            .map_err(|e| format!("event callback failed: {e:?}"))?;
        Ok(())
    }

    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String> {
        self.callback
            .call2(
                &JsValue::NULL,
                &JsValue::from_str(event_name),
                &JsValue::from_str(payload),
            )
            .map_err(|e| format!("event callback failed: {e:?}"))?;
        Ok(())
    }
}

static EVENT_CALLBACK: OnceLock<Mutex<Option<js_sys::Function>>> = OnceLock::new();
static SHARE_SESSION: OnceLock<Mutex<Option<WasmShareSession>>> = OnceLock::new();

fn event_slot() -> &'static Mutex<Option<js_sys::Function>> {
    EVENT_CALLBACK.get_or_init(|| Mutex::new(None))
}

fn share_slot() -> &'static Mutex<Option<WasmShareSession>> {
    SHARE_SESSION.get_or_init(|| Mutex::new(None))
}

fn app_handle() -> AppHandle {
    let guard = event_slot().lock().expect("event callback mutex poisoned");
    guard
        .as_ref()
        .map(|callback| Arc::new(JsEventEmitter { callback: callback.clone() }) as Arc<dyn EventEmitter>)
}

fn js_err(err: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&err.to_string())
}

fn parse_relay_config(json: Option<String>) -> Result<Option<RelayConfigArg>, JsValue> {
    match json {
        None => Ok(None),
        Some(raw) if raw.trim().is_empty() => Ok(None),
        Some(raw) => serde_json::from_str(&raw).map_err(js_err),
    }
}

async fn resolve_relay_mode(json: Option<String>) -> Result<RelayModeOption, JsValue> {
    let arg = parse_relay_config(json)?;
    let (relay_mode, fell_back) = resolve_relay_mode_with_fallback(arg)
        .await
        .map_err(js_err)?;
    if fell_back {
        if let Some(handle) = app_handle() {
            let _ = handle.emit_event_with_payload("relay-fell-back", "send");
        }
    }
    Ok(relay_mode)
}

/// Register `(eventName, payload?) => void` for transfer progress events.
#[wasm_bindgen]
pub fn set_event_callback(callback: js_sys::Function) {
    *event_slot().lock().expect("event callback mutex poisoned") = Some(callback);
}

/// Persist node identity across page reloads (hex-encoded iroh secret key).
#[wasm_bindgen]
pub fn set_secret_key(secret_hex: &str) -> Result<(), JsValue> {
    let key = iroh::SecretKey::from_str(secret_hex).map_err(js_err)?;
    set_wasm_secret_key(key);
    Ok(())
}

#[wasm_bindgen]
pub struct WasmSendResult {
    ticket: String,
    hash: String,
    size: u64,
}

#[wasm_bindgen]
impl WasmSendResult {
    #[wasm_bindgen(getter)]
    pub fn ticket(&self) -> String {
        self.ticket.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn hash(&self) -> String {
        self.hash.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn size(&self) -> u64 {
        self.size
    }
}

#[wasm_bindgen]
pub struct WasmReceiveFileResult {
    file_names: Vec<String>,
    bytes_js: js_sys::Array,
}

#[wasm_bindgen]
impl WasmReceiveFileResult {
    #[wasm_bindgen(getter)]
    pub fn file_names(&self) -> Vec<String> {
        self.file_names.clone()
    }

    #[wasm_bindgen(getter, js_name = bytesArray)]
    pub fn bytes_array(&self) -> js_sys::Array {
        self.bytes_js.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn file_name(&self) -> String {
        self.file_names
            .first()
            .cloned()
            .unwrap_or_else(|| "download".to_string())
    }

    #[wasm_bindgen(getter)]
    pub fn bytes(&self) -> Vec<u8> {
        if self.bytes_js.length() == 0 {
            return Vec::new();
        }

        let uint8 = js_sys::Uint8Array::new(&self.bytes_js.get(0));
        let mut bytes = vec![0u8; uint8.length() as usize];
        uint8.copy_to(&mut bytes);
        bytes
    }
}

fn files_to_js_array(files: &[(String, Vec<u8>)]) -> js_sys::Array {
    let array = js_sys::Array::new();
    for (_, bytes) in files {
        let uint8 = js_sys::Uint8Array::from(bytes.as_slice());
        array.push(&uint8);
    }
    array
}

/// Share a single in-memory file (relay-only ticket).
#[wasm_bindgen]
pub async fn send_file(
    file_name: String,
    bytes: Vec<u8>,
    metadata_json: Option<String>,
    relay_json: Option<String>,
) -> Result<WasmSendResult, JsValue> {
    let metadata = match metadata_json {
        Some(json) => Some(serde_json::from_str::<FileMetadata>(&json).map_err(js_err)?),
        None => None,
    };

    let relay_mode = resolve_relay_mode(relay_json).await?;
    let options = SendOptions {
        relay_mode,
        discovery_mode: Default::default(),
        ticket_type: AddrInfoOptions::Relay,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let session = start_share_bytes(file_name, bytes, options, &app_handle(), metadata)
        .await
        .map_err(js_err)?;

    let result = WasmSendResult {
        ticket: session.ticket.clone(),
        hash: session.hash.clone(),
        size: session.size,
    };

    *share_slot().lock().expect("share session mutex poisoned") = Some(session);
    Ok(result)
}

fn parse_send_items(
    names: &js_sys::Array,
    bytes_array: &js_sys::Array,
) -> Result<Vec<(String, Vec<u8>)>, JsValue> {
    if names.length() != bytes_array.length() {
        return Err(JsValue::from_str(
            "names and bytes arrays must have the same length",
        ));
    }

    let mut items = Vec::with_capacity(names.length() as usize);
    for index in 0..names.length() {
        let name = names
            .get(index)
            .as_string()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| JsValue::from_str("each item must have a non-empty name"))?;

        let bytes_value = bytes_array.get(index);
        if bytes_value.is_undefined() || bytes_value.is_null() {
            return Err(JsValue::from_str("each item must include file bytes"));
        }

        let uint8 = js_sys::Uint8Array::new(&bytes_value);
        let mut bytes = vec![0u8; uint8.length() as usize];
        uint8.copy_to(&mut bytes);
        items.push((name, bytes));
    }

    Ok(items)
}

/// Share one or more in-memory files or folders (relay-only ticket).
#[wasm_bindgen]
pub async fn send_items(
    names: js_sys::Array,
    bytes_array: js_sys::Array,
    entry_type: String,
    metadata_json: Option<String>,
    relay_json: Option<String>,
) -> Result<WasmSendResult, JsValue> {
    let items = parse_send_items(&names, &bytes_array)?;
    if items.is_empty() {
        return Err(JsValue::from_str("no files provided"));
    }

    let metadata = match metadata_json {
        Some(json) => Some(serde_json::from_str::<FileMetadata>(&json).map_err(js_err)?),
        None => None,
    };

    let relay_mode = resolve_relay_mode(relay_json).await?;
    let options = SendOptions {
        relay_mode,
        discovery_mode: Default::default(),
        ticket_type: AddrInfoOptions::Relay,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let session = if items.len() == 1 && entry_type == "file" {
        let (file_name, bytes) = items
            .into_iter()
            .next()
            .expect("validated non-empty items");
        start_share_bytes(file_name, bytes, options, &app_handle(), metadata)
            .await
            .map_err(js_err)?
    } else {
        start_share_items_bytes(
            items,
            entry_type,
            options,
            &app_handle(),
            metadata,
        )
        .await
        .map_err(js_err)?
    };

    let result = WasmSendResult {
        ticket: session.ticket.clone(),
        hash: session.hash.clone(),
        size: session.size,
    };

    *share_slot().lock().expect("share session mutex poisoned") = Some(session);
    Ok(result)
}

/// Stop the active browser share session, if any.
#[wasm_bindgen]
pub fn stop_sharing() {
    let _ = share_slot().lock().expect("share session mutex poisoned").take();
}

/// Fetch sender metadata JSON for a ticket (no file download).
#[wasm_bindgen]
pub async fn fetch_ticket_metadata(
    ticket: String,
    relay_json: Option<String>,
) -> Result<String, JsValue> {
    let relay_mode = resolve_relay_mode(relay_json).await?;
    let options = ReceiveOptions {
        output_dir: None,
        relay_mode,
        discovery_mode: Default::default(),
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let metadata = fetch_metadata(ticket, options).await.map_err(js_err)?;
    serde_json::to_string(&metadata).map_err(js_err)
}

/// Download a ticket into memory (single file or folder collection).
#[wasm_bindgen]
pub async fn receive_file(
    ticket: String,
    relay_json: Option<String>,
) -> Result<WasmReceiveFileResult, JsValue> {
    let relay_mode = resolve_relay_mode(relay_json).await?;
    let options = ReceiveOptions {
        output_dir: None,
        relay_mode,
        discovery_mode: Default::default(),
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let WasmReceiveResult { files } =
        download_files(ticket, options, app_handle()).await.map_err(js_err)?;

    let file_names = files.iter().map(|(name, _)| name.clone()).collect();
    let bytes_js = files_to_js_array(&files);

    Ok(WasmReceiveFileResult {
        file_names,
        bytes_js,
    })
}

/// Verify connectivity to configured relay servers. Returns JSON (`VerifyRelaysResponse`).
#[wasm_bindgen]
pub async fn verify_relays(relay_json: String) -> Result<String, JsValue> {
    let relay: RelayConfigArg = serde_json::from_str(&relay_json).map_err(js_err)?;
    let response = engine_verify_relays(relay).await.map_err(js_err)?;
    serde_json::to_string(&response).map_err(js_err)
}

/// Check which relay the app can reach. Returns JSON (`RelayStatusResponse`).
#[wasm_bindgen]
pub async fn get_relay_status(relay_json: Option<String>) -> Result<String, JsValue> {
    let relay = parse_relay_config(relay_json)?;
    let response = engine_get_relay_status(relay).await.map_err(js_err)?;
    serde_json::to_string(&response).map_err(js_err)
}

/// Bind a relay-only iroh endpoint and return its node id (smoke test).
#[wasm_bindgen]
pub async fn smoke_test_endpoint() -> Result<String, JsValue> {
    use iroh::endpoint::presets;
    use iroh::Endpoint;

    let endpoint = with_system_ca_if_custom(Endpoint::builder(presets::N0), false)
        .bind()
        .await
        .map_err(|e| JsValue::from_str(&format!("endpoint bind failed: {e}")))?;

    let id = endpoint.id().to_string();
    endpoint.close().await;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_relay_config_accepts_absent_json() {
        assert!(parse_relay_config(None).unwrap().is_none());
        assert!(parse_relay_config(Some("".to_string())).unwrap().is_none());
    }

    #[test]
    fn parse_relay_config_deserializes_frontend_payload() {
        let arg = parse_relay_config(Some(
            r#"{"mode":"custom","urls":["https://relay.example.com"],"auth_token":"secret","fallback":"strict"}"#
                .to_string(),
        ))
        .unwrap()
        .expect("relay config should parse");

        assert_eq!(arg.mode, "custom");
        assert_eq!(arg.urls, vec!["https://relay.example.com".to_string()]);
        assert_eq!(arg.auth_token.as_deref(), Some("secret"));
        assert_eq!(arg.fallback.as_deref(), Some("strict"));
    }
}
