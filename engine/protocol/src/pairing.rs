//! Pairing session constants and helpers.

pub const PAIRING_VOTE_TIMEOUT_SECS: u64 = 120;

/// Minimum backoff between reconnect attempts to a paired device.
pub const PAIRED_RECONNECT_MIN_SECS: u64 = 5;

/// Maximum backoff between reconnect attempts to a paired device.
pub const PAIRED_RECONNECT_MAX_SECS: u64 = 60;

/// How long a freshly stored pairing counts as still settling. Mutual pairing
/// commits independently on each side, so a `Recognition` refused this soon
/// after we stored our half is far better explained by the peer not having
/// stored its own yet than by a real unpair — see
/// `PairedConnectionManager::connect_loop`.
pub const RECENT_PAIRING_GRACE_MS: u64 = 10_000;

/// Backoff after a `Recognition` refused while the pairing is still settling.
/// Shorter than [`PAIRED_RECONNECT_MIN_SECS`]: the peer's half lands in
/// milliseconds, and until it does presence is one-directional.
pub const SETTLING_PAIRING_RETRY_SECS: u64 = 2;

/// How long invite delivery waits for a live paired connection.
pub const PAIRED_INVITE_WAIT_SECS: u64 = 30;

/// Connect timeout for one-off operations (forget notify, fallback connect).
pub const PRESENCE_CONNECT_TIMEOUT_SECS: u64 = 8;

/// When `ttl_secs` is [`None`], the pairing host stays open until explicitly stopped
/// (e.g. during an active share session). `Some(n)` starts a timed window.
pub fn pairing_host_is_persistent(ttl_secs: Option<u64>) -> bool {
    ttl_secs.is_none()
}
