//! Coarse per-endpoint-id rate limiting for unpaired control traffic.
//!
//! Under `Discoverability::Everyone` an unpaired peer's messages can surface UI
//! or trigger dials, so a token bucket per endpoint id stops a stranger probing
//! or inviting in a tight loop. A legitimate first contact fits in the burst.
//!
//! Pure state with an injected clock. The consumer is
//! `node::ControlProtocol::handle_control_session`, one token per message.

use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Burst allowance per endpoint id — above the 2-3 messages a legitimate first
/// contact needs, below anything resembling a spam loop.
pub(crate) const UNPAIRED_BURST: u32 = 8;

/// One token refills per this interval, so a stranger who exhausted the burst
/// is throttled to one message every two seconds.
pub(crate) const UNPAIRED_REFILL_INTERVAL: Duration = Duration::from_secs(2);

/// Cap on tracked endpoint ids. When full, idle buckets are pruned; if every
/// peer is still throttled, new strangers are refused rather than growing it.
pub(crate) const MAX_TRACKED_PEERS: usize = 512;

#[derive(Debug)]
struct Bucket {
    tokens: u32,
    last_refill: Instant,
}

/// See the module docs. `allow` is the whole API: one call, one token.
#[derive(Debug)]
pub(crate) struct UnpairedRateLimiter {
    burst: u32,
    refill_interval: Duration,
    buckets: HashMap<String, Bucket>,
}

impl UnpairedRateLimiter {
    pub(crate) fn new() -> Self {
        Self::with_config(UNPAIRED_BURST, UNPAIRED_REFILL_INTERVAL)
    }

    fn with_config(burst: u32, refill_interval: Duration) -> Self {
        Self {
            burst,
            refill_interval,
            buckets: HashMap::new(),
        }
    }

    /// Charges one token to `endpoint_id`'s bucket. Returns false when the
    /// bucket is empty — the caller should drop the message (and connection).
    pub(crate) fn allow(&mut self, endpoint_id: &str, now: Instant) -> bool {
        let key = endpoint_id.to_lowercase();

        if !self.buckets.contains_key(&key) && self.buckets.len() >= MAX_TRACKED_PEERS {
            self.prune(now);
            if self.buckets.len() >= MAX_TRACKED_PEERS {
                return false;
            }
        }

        let bucket = self.buckets.entry(key).or_insert(Bucket {
            tokens: self.burst,
            last_refill: now,
        });

        let elapsed = now.saturating_duration_since(bucket.last_refill);
        let interval_ms = self.refill_interval.as_millis().max(1);
        let refills = (elapsed.as_millis() / interval_ms) as u32;
        if refills > 0 {
            bucket.tokens = bucket.tokens.saturating_add(refills).min(self.burst);
            bucket.last_refill += self.refill_interval * refills;
        }

        if bucket.tokens == 0 {
            return false;
        }
        bucket.tokens -= 1;
        true
    }

    /// Drops buckets that have fully refilled — an idle peer's bucket carries
    /// no state worth keeping, since a fresh entry starts full anyway.
    fn prune(&mut self, now: Instant) {
        let burst = self.burst;
        let interval_ms = self.refill_interval.as_millis().max(1);
        self.buckets.retain(|_, bucket| {
            let elapsed = now.saturating_duration_since(bucket.last_refill);
            let refills = (elapsed.as_millis() / interval_ms) as u32;
            bucket.tokens.saturating_add(refills) < burst
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn burst_is_allowed_then_denied() {
        let mut limiter = UnpairedRateLimiter::with_config(3, Duration::from_secs(2));
        let now = Instant::now();
        assert!(limiter.allow("peer-a", now));
        assert!(limiter.allow("peer-a", now));
        assert!(limiter.allow("peer-a", now));
        assert!(!limiter.allow("peer-a", now), "burst exhausted");
    }

    #[test]
    fn tokens_refill_over_time() {
        let mut limiter = UnpairedRateLimiter::with_config(2, Duration::from_secs(2));
        let start = Instant::now();
        assert!(limiter.allow("peer-a", start));
        assert!(limiter.allow("peer-a", start));
        assert!(!limiter.allow("peer-a", start));

        // One interval elapses: exactly one token back.
        let later = start + Duration::from_secs(2);
        assert!(limiter.allow("peer-a", later));
        assert!(!limiter.allow("peer-a", later));

        // Long idle refills to the cap, not beyond it.
        let much_later = start + Duration::from_secs(60);
        assert!(limiter.allow("peer-a", much_later));
        assert!(limiter.allow("peer-a", much_later));
        assert!(!limiter.allow("peer-a", much_later));
    }

    #[test]
    fn peers_are_limited_independently() {
        let mut limiter = UnpairedRateLimiter::with_config(1, Duration::from_secs(2));
        let now = Instant::now();
        assert!(limiter.allow("peer-a", now));
        assert!(!limiter.allow("peer-a", now));
        assert!(limiter.allow("peer-b", now), "peer-b has its own bucket");
    }

    #[test]
    fn endpoint_ids_match_case_insensitively() {
        let mut limiter = UnpairedRateLimiter::with_config(1, Duration::from_secs(2));
        let now = Instant::now();
        assert!(limiter.allow("PEER-A", now));
        assert!(
            !limiter.allow("peer-a", now),
            "same peer, different case, same bucket"
        );
    }

    #[test]
    fn idle_buckets_are_pruned_when_full() {
        let mut limiter = UnpairedRateLimiter::with_config(2, Duration::from_secs(2));
        let start = Instant::now();
        for i in 0..MAX_TRACKED_PEERS {
            assert!(limiter.allow(&format!("peer-{i}"), start));
        }
        // Everyone above refills within two intervals; a newcomer then fits.
        let later = start + Duration::from_secs(4);
        assert!(limiter.allow("newcomer", later));
        assert!(limiter.buckets.len() <= MAX_TRACKED_PEERS);
    }

    #[test]
    fn new_peers_are_refused_when_all_tracked_peers_are_active() {
        let mut limiter = UnpairedRateLimiter::with_config(1, Duration::from_secs(2));
        let now = Instant::now();
        for i in 0..MAX_TRACKED_PEERS {
            // Two calls: the second empties the bucket so nothing is prunable.
            limiter.allow(&format!("peer-{i}"), now);
            limiter.allow(&format!("peer-{i}"), now);
        }
        assert!(
            !limiter.allow("newcomer", now),
            "a full map of actively throttled peers must not grow further"
        );
    }
}
