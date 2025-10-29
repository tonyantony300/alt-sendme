# Cleanup Improvements Summary

## Overview
This document summarizes the cleanup improvements implemented to better manage temporary `.sendme-*` directories.

## Problem Statement
Previously, the application created temporary `.sendme-send-*` and `.sendme-recv-*` directories in the current working directory, which:
- Polluted user directories with temporary files
- Could be left behind after crashes
- Increased directory sizes unnecessarily
- Were not properly managed by the OS

## Changes Implemented

### 1. Use System Temp Directory (`src/core/send.rs`)
**Changed:** Temporary blob storage location from `current_dir()` to `temp_dir()`

```rust
// Before: Creates in current directory
let cwd = std::env::current_dir()?;
let blobs_data_dir = cwd.join(format!(".sendme-send-{}", HEXLOWER.encode(&suffix)));

// After: Creates in system temp directory
let temp_base = std::env::temp_dir();
let blobs_data_dir = temp_base.join(format!(".sendme-send-{}", HEXLOWER.encode(&suffix)));
```

**Benefits:**
- No pollution of user directories
- OS manages automatic cleanup
- Better for GUI applications
- Avoids permission issues

### 2. Use System Temp Directory (`src/core/receive.rs`)
**Changed:** Receive-side temporary storage to use `temp_dir()`

```rust
// Before:
let iroh_data_dir = std::env::current_dir()?.join(&dir_name);

// After:
let temp_base = std::env::temp_dir();
let iroh_data_dir = temp_base.join(&dir_name);
```

### 3. Orphan Cleanup (`src-tauri/src/main.rs`)
**Added:** `cleanup_orphaned_directories()` function that runs on startup

This function:
- Scans both `current_dir()` (for legacy directories) and `temp_dir()` (for current directories)
- Removes any leftover `.sendme-send-*` and `.sendme-recv-*` directories
- Handles transition from old location to new location
- Logs all cleanup operations

**Why scan both directories?**
- Handles legacy directories from before this change
- Smooth transition period
- Eventually only temp_dir needs to be scanned

### 4. Improved Drop Cleanup (`src-tauri/src/state.rs`)
**Changed:** Drop implementation to use blocking I/O instead of async

```rust
// Before: Async in Drop (problematic)
let blobs_dir = self.send_result.blobs_data_dir.clone();
tokio::spawn(async move {
    match tokio::fs::remove_dir_all(&blobs_dir).await {
        // ...
    }
});

// After: Blocking I/O in spawned thread (correct)
let blobs_dir = self.send_result.blobs_data_dir.clone();
std::thread::spawn(move || {
    match std::fs::remove_dir_all(&blobs_dir) {
        // ...
    }
});
```

**Why this is better:**
- `Drop` trait is synchronous, blocking I/O is appropriate
- More reliable cleanup on teardown
- Avoids async-in-Drop pitfalls
- Proper Rust idiom for cleanup in Drop

### 5. Simplified stop() Method (`src-tauri/src/state.rs`)
**Changed:** Removed unsafe code and simplified cleanup logic

```rust
// Before: Manual cleanup, unsafe mem::zeroed()
drop(std::mem::replace(&mut self.send_result.temp_tag, unsafe { std::mem::zeroed() }));
// ... manual drops

// After: Let Rust's Drop handle it
// temp_tag, _store, and _progress_handle will be dropped automatically
// Cleanup of blobs directory will happen in Drop trait
```

**Benefits:**
- Removes unsafe code
- Simpler and more maintainable
- Relies on Rust's ownership system
- Less error-prone

## What These Directories Contain

### `.sendme-send-*` (Sender side)
- BLAKE3 hash-verified chunks of shared files
- Metadata about collections
- Typically equals the size of files being shared
- **Example:** Sharing a 1GB file requires ~1GB+ in temp storage

### `.sendme-recv-*` (Receiver side)
- Downloaded chunks before final export
- During download, requires space for both temp dir AND final files
- Essentially doubles disk usage temporarily
- **Example:** Downloading 500MB requires ~500MB temp + 500MB final = 1GB total

## Are These Directories Needed?

**NO** - They are purely temporary workarounds:
- Not for caching (don't improve performance on subsequent runs)
- Should ALWAYS be cleaned up after use
- The code has TODOs to replace with in-memory store eventually

```rust
// From the code:
// todo: use a partial in mem store instead
```

## Files Modified

1. ✅ `src/core/send.rs` - Use temp_dir() for sender
2. ✅ `src/core/receive.rs` - Use temp_dir() for receiver
3. ✅ `src-tauri/src/main.rs` - Add orphan cleanup on startup
4. ✅ `src-tauri/src/state.rs` - Improve Drop cleanup, simplify stop()

## Files NOT Modified

❌ `src/main.rs` - CLI version left unchanged as requested

## Testing

Build verification passed:
```bash
cargo check --all
# Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.18s
```

No linter errors detected.

## Future Improvements

1. **In-memory store:** Eventually replace FsStore with in-memory implementation
2. **Single location:** Once all users have transitioned, remove current_dir() scanning
3. **Metrics:** Track temp directory sizes and cleanup success rates

## Commit Reference

This implementation is based on commit `96c3e1d` ("clean up methods added") with the following fixes:
- Fixed cleanup location mismatch (now scans temp_dir where files actually are)
- Extended cleanup to both send and recv directories
- Handles transition period by scanning both locations

