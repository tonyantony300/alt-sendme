use crate::{
    download, start_share, AddrInfoOptions, AppHandle, EventEmitter, ReceiveOptions, RelayModeOption,
    SendOptions,
};
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};

static RUNTIME: OnceLock<tokio::runtime::Runtime> = OnceLock::new();
static ACTIVE_SHARES: OnceLock<Mutex<HashMap<u64, crate::SendResult>>> = OnceLock::new();
static NEXT_HANDLE: AtomicU64 = AtomicU64::new(1);
static DART_API_READY: AtomicBool = AtomicBool::new(false);
static DART_EVENT_PORT: AtomicU64 = AtomicU64::new(0);
static DART_POST_COBJECT: OnceLock<DartPostCObjectFn> = OnceLock::new();

// DART_API_DL_MAJOR_VERSION from dart_version.h.
const DART_API_DL_MAJOR_VERSION: i32 = 2;

#[repr(C)]
#[allow(dead_code)]
enum DartCObjectType {
    Null = 0,
    Bool = 1,
    Int32 = 2,
    Int64 = 3,
    Double = 4,
    String = 5,
    Array = 6,
    TypedData = 7,
    ExternalTypedData = 8,
    SendPort = 9,
    Capability = 10,
    NativePointer = 11,
    Unsupported = 12,
}

#[repr(C)]
#[derive(Clone, Copy)]
struct DartCObjectArray {
    length: isize,
    values: *mut *mut DartCObject,
}

#[repr(C)]
union DartCObjectValue {
    as_string: *mut c_char,
    as_array: DartCObjectArray,
}

#[repr(C)]
struct DartCObject {
    type_: DartCObjectType,
    value: DartCObjectValue,
}

#[repr(C)]
struct DartApiEntry {
    name: *const c_char,
    function: *const c_void,
}

#[repr(C)]
struct DartApi {
    major: i32,
    minor: i32,
    functions: *const DartApiEntry,
}

type DartPostCObjectFn = unsafe extern "C" fn(port: i64, message: *mut DartCObject) -> bool;

fn runtime() -> &'static tokio::runtime::Runtime {
    RUNTIME.get_or_init(|| {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("failed to create tokio runtime")
    })
}

fn shares() -> &'static Mutex<HashMap<u64, crate::SendResult>> {
    ACTIVE_SHARES.get_or_init(|| Mutex::new(HashMap::new()))
}

fn post_dart_event(event_name: &str, payload: &str) {
    if !DART_API_READY.load(Ordering::Relaxed) {
        return;
    }
    let port = DART_EVENT_PORT.load(Ordering::Relaxed);
    if port == 0 {
        return;
    }
    let Some(post_cobject) = DART_POST_COBJECT.get().copied() else {
        return;
    };

    let name_c = match CString::new(event_name) {
        Ok(s) => s,
        Err(_) => return,
    };
    let payload_c = match CString::new(payload) {
        Ok(s) => s,
        Err(_) => return,
    };

    let name_raw = name_c.into_raw();
    let payload_raw = payload_c.into_raw();

    let name_obj = Box::new(DartCObject {
        type_: DartCObjectType::String,
        value: DartCObjectValue { as_string: name_raw },
    });
    let payload_obj = Box::new(DartCObject {
        type_: DartCObjectType::String,
        value: DartCObjectValue {
            as_string: payload_raw,
        },
    });

    let name_ptr = Box::into_raw(name_obj);
    let payload_ptr = Box::into_raw(payload_obj);

    let mut values = Box::new([name_ptr, payload_ptr]);
    let array_obj = Box::new(DartCObject {
        type_: DartCObjectType::Array,
        value: DartCObjectValue {
            as_array: DartCObjectArray {
                length: 2,
                values: values.as_mut_ptr(),
            },
        },
    });
    let array_ptr = Box::into_raw(array_obj);

    unsafe {
        let _ = post_cobject(port as i64, array_ptr);

        let _ = Box::from_raw(array_ptr);
        let _ = Box::from_raw(name_ptr);
        let _ = Box::from_raw(payload_ptr);

        let _ = CString::from_raw(name_raw);
        let _ = CString::from_raw(payload_raw);
    }
}

#[derive(Clone)]
struct DartEventEmitter;

impl EventEmitter for DartEventEmitter {
    fn emit_event(&self, event_name: &str) -> Result<(), String> {
        post_dart_event(event_name, "");
        Ok(())
    }

    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String> {
        post_dart_event(event_name, payload);
        Ok(())
    }
}

fn current_app_handle() -> AppHandle {
    if !DART_API_READY.load(Ordering::Relaxed) {
        return None;
    }
    let port = DART_EVENT_PORT.load(Ordering::Relaxed);
    if port == 0 {
        return None;
    }
    Some(Arc::new(DartEventEmitter))
}

fn ok() -> *mut c_char {
    std::ptr::null_mut()
}

fn err_to_c_string(err: impl ToString) -> *mut c_char {
    CString::new(err.to_string())
        .unwrap_or_else(|_| CString::new("unknown error").expect("valid c string"))
        .into_raw()
}

fn c_str_to_string(ptr: *const c_char, arg_name: &str) -> Result<String, *mut c_char> {
    if ptr.is_null() {
        return Err(err_to_c_string(format!("{arg_name} is null")));
    }
    // SAFETY: caller guarantees ptr is a valid NUL-terminated string.
    let s = unsafe { CStr::from_ptr(ptr) };
    s.to_str()
        .map(|s| s.to_string())
        .map_err(|e| err_to_c_string(format!("{arg_name} is not valid UTF-8: {e}")))
}

#[no_mangle]
pub extern "C" fn sendme_ffi_free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    // SAFETY: ptr must have been allocated by CString::into_raw.
    unsafe {
        let _ = CString::from_raw(ptr);
    }
}

#[no_mangle]
pub extern "C" fn sendme_ffi_version() -> *mut c_char {
    CString::new(env!("CARGO_PKG_VERSION"))
        .expect("valid c string")
        .into_raw()
}

#[no_mangle]
pub extern "C" fn sendme_ffi_init_dart_api(data: *mut c_void) -> isize {
    if data.is_null() {
        return -10;
    }

    // SAFETY: `NativeApi.initializeApiDLData` points to a DartApi struct.
    let api = unsafe { &*(data as *const DartApi) };
    if api.major != DART_API_DL_MAJOR_VERSION {
        return -1;
    }
    if api.functions.is_null() {
        return -11;
    }

    let mut entry = api.functions;
    let mut post_cobject: Option<DartPostCObjectFn> = None;

    // SAFETY: entry points to a NULL-terminated list (name == NULL).
    unsafe {
        while !(*entry).name.is_null() {
            let name = CStr::from_ptr((*entry).name).to_string_lossy();
            if name == "Dart_PostCObject" {
                post_cobject = Some(std::mem::transmute((*entry).function));
                break;
            }
            entry = entry.add(1);
        }
    }

    let Some(fn_ptr) = post_cobject else {
        return -2;
    };

    let _ = DART_POST_COBJECT.set(fn_ptr);
    DART_API_READY.store(true, Ordering::Relaxed);
    0
}

#[no_mangle]
pub extern "C" fn sendme_ffi_set_event_port(port: u64) {
    DART_EVENT_PORT.store(port, Ordering::Relaxed);
}

#[no_mangle]
pub extern "C" fn sendme_ffi_start_share(
    path: *const c_char,
    out_handle: *mut u64,
    out_ticket: *mut *mut c_char,
) -> *mut c_char {
    if out_handle.is_null() || out_ticket.is_null() {
        return err_to_c_string("out pointers are null");
    }

    let path_str = match c_str_to_string(path, "path") {
        Ok(s) => s,
        Err(e) => return e,
    };

    let options = SendOptions {
        relay_mode: RelayModeOption::Default,
        ticket_type: AddrInfoOptions::RelayAndAddresses,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let app_handle = current_app_handle();
    let send_result = match runtime().block_on(start_share(PathBuf::from(path_str), options, app_handle)) {
        Ok(r) => r,
        Err(e) => return err_to_c_string(format!("start_share failed: {e}")),
    };

    let handle = NEXT_HANDLE.fetch_add(1, Ordering::Relaxed);
    let ticket = send_result.ticket.clone();

    {
        let mut guard = match shares().lock() {
            Ok(g) => g,
            Err(_) => return err_to_c_string("active share lock poisoned"),
        };
        guard.insert(handle, send_result);
    }

    // SAFETY: out pointers validated above.
    unsafe {
        *out_handle = handle;
        let ticket_c = match CString::new(ticket) {
            Ok(s) => s,
            Err(_) => return err_to_c_string("ticket contains interior NUL"),
        };
        *out_ticket = ticket_c.into_raw();
    }

    ok()
}

#[no_mangle]
pub extern "C" fn sendme_ffi_stop_share(handle: u64) -> *mut c_char {
    let send_result = {
        let mut guard = match shares().lock() {
            Ok(g) => g,
            Err(_) => return err_to_c_string("active share lock poisoned"),
        };
        match guard.remove(&handle) {
            Some(s) => s,
            None => return err_to_c_string("share handle not found"),
        }
    };

    // Best-effort graceful shutdown.
    let router = send_result.router;
    let blobs_dir = send_result.blobs_data_dir.clone();
    runtime().block_on(async move {
        use std::time::Duration;
        match tokio::time::timeout(Duration::from_secs(2), router.shutdown()).await {
            Ok(Ok(())) => {}
            Ok(Err(e)) => tracing::warn!("router shutdown error: {e}"),
            Err(_) => tracing::warn!("router shutdown timeout after 2 seconds"),
        }
    });

    // Clean up temp dir like the desktop app does.
    if let Err(e) = std::fs::remove_dir_all(&blobs_dir) {
        tracing::warn!(
            "failed to clean up blobs directory {}: {}",
            blobs_dir.display(),
            e
        );
    }

    ok()
}

#[no_mangle]
pub extern "C" fn sendme_ffi_receive_file(
    ticket: *const c_char,
    output_dir: *const c_char,
    out_message: *mut *mut c_char,
    out_file_path: *mut *mut c_char,
) -> *mut c_char {
    if out_message.is_null() || out_file_path.is_null() {
        return err_to_c_string("out pointers are null");
    }

    let ticket_str = match c_str_to_string(ticket, "ticket") {
        Ok(s) => s,
        Err(e) => return e,
    };
    let output_dir_str = match c_str_to_string(output_dir, "output_dir") {
        Ok(s) => s,
        Err(e) => return e,
    };

    let options = ReceiveOptions {
        output_dir: Some(PathBuf::from(output_dir_str)),
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    let app_handle = current_app_handle();
    let result = match runtime().block_on(download(ticket_str, options, app_handle)) {
        Ok(r) => r,
        Err(e) => return err_to_c_string(format!("download failed: {e}")),
    };

    // SAFETY: out pointers validated above.
    unsafe {
        let message_c = match CString::new(result.message) {
            Ok(s) => s,
            Err(_) => return err_to_c_string("message contains interior NUL"),
        };
        let file_path_c = match CString::new(result.file_path.to_string_lossy().to_string()) {
            Ok(s) => s,
            Err(_) => return err_to_c_string("file_path contains interior NUL"),
        };

        *out_message = message_c.into_raw();
        *out_file_path = file_path_c.into_raw();
    }

    ok()
}
