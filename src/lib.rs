pub mod core;
#[cfg(feature = "ffi")]
pub mod ffi;

pub use core::{
    send::{start_share},
    receive::{download},
    types::{SendResult, ReceiveResult, SendOptions, ReceiveOptions, RelayModeOption, AddrInfoOptions, AppHandle, EventEmitter},
};
