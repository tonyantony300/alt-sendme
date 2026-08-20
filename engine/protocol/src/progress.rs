//! Shared transfer-progress accounting for both sides of a transfer.
//!
//! Sender and receiver used to compute "bytes transferred" and "speed" with
//! independent, subtly different rules, so the two ends disagreed on the same
//! transfer. Both now go through this module.

use std::collections::{BTreeMap, HashMap, VecDeque};

/// Blob indices below this carry protocol overhead, not user payload:
/// index 0 is the hash-seq root, index 1 is the collection metadata blob
/// (file names). Every share is stored as a collection, so this holds for
/// single-file shares too.
pub const FIRST_PAYLOAD_BLOB_INDEX: u64 = 2;

/// A window shorter than this is send-buffer noise rather than a transfer rate.
const MIN_WINDOW_SECS: f64 = 0.1;

/// Speed is averaged over this many seconds on both sides.
pub const SPEED_WINDOW_SECS: f64 = 3.0;

/// Progress is emitted at most once per this many bytes ...
pub const PROGRESS_MIN_BYTES: u64 = 1024 * 1024;

/// ... or once per this many seconds, whichever comes first.
pub const PROGRESS_MIN_SECS: f64 = 0.2;

/// Payload byte counts derived from a hash-seq `sizes` vector.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PayloadSizes {
    /// Hash-seq root + collection metadata: transferred, but not user payload.
    pub overhead_bytes: u64,
    /// Sum of the actual file sizes.
    pub payload_bytes: u64,
}

/// Split a transfer into protocol overhead and user payload.
///
/// `child_sizes` is the children-only vector from `get_hash_seq_and_sizes`:
/// entry 0 is the collection metadata blob, the rest are the shared files.
/// `root_bytes` is the size of the hash-seq root blob, which is transferred
/// before them and is not part of that vector.
pub fn split_child_sizes(root_bytes: u64, child_sizes: &[u64]) -> PayloadSizes {
    let metadata_bytes = child_sizes.first().copied().unwrap_or(0);
    PayloadSizes {
        overhead_bytes: root_bytes + metadata_bytes,
        payload_bytes: child_sizes.iter().skip(1).copied().sum(),
    }
}

/// Sliding-window speed estimate fed with cumulative byte counts.
///
/// A cumulative average (`bytes_so_far / elapsed`) never recovers from a slow
/// start and never drops on a stall; this reports the recent rate instead.
pub struct SpeedMeter {
    window_secs: f64,
    samples: VecDeque<(f64, u64)>,
}

impl SpeedMeter {
    pub fn new(window_secs: f64) -> Self {
        Self {
            window_secs,
            samples: VecDeque::new(),
        }
    }

    pub fn record(&mut self, at_secs: f64, cumulative_bytes: u64) {
        self.samples.push_back((at_secs, cumulative_bytes));
        let cutoff = at_secs - self.window_secs;
        while self.samples.len() > 1 {
            let Some(&(front_secs, _)) = self.samples.front() else {
                break;
            };
            if front_secs >= cutoff {
                break;
            }
            self.samples.pop_front();
        }
    }

    /// Bytes per second over the window. `now_secs` extends the window when no
    /// sample has arrived recently, so a stalled transfer decays toward zero.
    pub fn bytes_per_sec_at(&self, now_secs: f64) -> f64 {
        let (Some(&(oldest_secs, oldest_bytes)), Some(&(newest_secs, newest_bytes))) =
            (self.samples.front(), self.samples.back())
        else {
            return 0.0;
        };

        let elapsed = now_secs.max(newest_secs) - oldest_secs;
        if elapsed < MIN_WINDOW_SECS {
            return 0.0;
        }
        newest_bytes.saturating_sub(oldest_bytes) as f64 / elapsed
    }

    pub fn reset(&mut self) {
        self.samples.clear();
    }
}

/// Payload accounting for one get request, driven by provider events.
///
/// Only bytes the provider reported writing are counted: a blob is never
/// credited with more than the highest offset seen for it.
#[derive(Debug, Default)]
pub struct RequestProgress {
    current_index: Option<u64>,
    ends: BTreeMap<u64, u64>,
    sizes: BTreeMap<u64, u64>,
}

impl RequestProgress {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn blob_started(&mut self, index: u64, size: u64) {
        self.current_index = Some(index);
        self.sizes.insert(index, size);
        self.ends.entry(index).or_insert(0);
    }

    pub fn blob_progress(&mut self, end_offset: u64) {
        let Some(index) = self.current_index else {
            return;
        };
        let capped = match self.sizes.get(&index) {
            Some(&size) => end_offset.min(size),
            None => end_offset,
        };
        let entry = self.ends.entry(index).or_insert(0);
        *entry = (*entry).max(capped);
    }

    pub fn payload_bytes(&self) -> u64 {
        self.ends
            .range(FIRST_PAYLOAD_BLOB_INDEX..)
            .map(|(_, &end)| end)
            .sum()
    }
}

/// Aggregate progress across all requests of a share session.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProgressSnapshot {
    pub bytes: u64,
    pub total: u64,
}

/// Whole-share ledger across every request served by one share session.
///
/// Each request delivers the whole share, so serving N peers is N shares of
/// work. Retired requests stay in the totals so the numbers never go backwards.
pub struct ShareProgress {
    share_size: u64,
    active: HashMap<(u64, u64), RequestProgress>,
    finished_bytes: u64,
    finished_requests: u64,
}

impl ShareProgress {
    pub fn new(share_size: u64) -> Self {
        Self {
            share_size,
            active: HashMap::new(),
            finished_bytes: 0,
            finished_requests: 0,
        }
    }

    pub fn blob_started(&mut self, key: (u64, u64), index: u64, size: u64) {
        self.active
            .entry(key)
            .or_default()
            .blob_started(index, size);
    }

    pub fn blob_progress(&mut self, key: (u64, u64), end_offset: u64) {
        if let Some(request) = self.active.get_mut(&key) {
            request.blob_progress(end_offset);
        }
    }

    /// Retire a request. A credited request keeps its bytes and its share of
    /// the total; an abandoned one is dropped from both, so a peer that gave up
    /// at 5% cannot leave the session stuck below 100%.
    pub fn retire(&mut self, key: (u64, u64), credited: bool) -> u64 {
        let Some(request) = self.active.remove(&key) else {
            return 0;
        };
        let bytes = request.payload_bytes().min(self.share_size);
        if credited {
            self.finished_bytes += bytes;
            self.finished_requests += 1;
        }
        bytes
    }

    pub fn request_bytes(&self, key: (u64, u64)) -> u64 {
        self.active
            .get(&key)
            .map(|request| request.payload_bytes().min(self.share_size))
            .unwrap_or(0)
    }

    /// Register a request that has reported activity but no blob yet.
    pub fn ensure_request(&mut self, key: (u64, u64)) {
        self.active.entry(key).or_default();
    }

    pub fn active_requests(&self) -> usize {
        self.active.len()
    }

    pub fn snapshot(&self) -> ProgressSnapshot {
        let active_bytes: u64 = self
            .active
            .values()
            .map(|request| request.payload_bytes().min(self.share_size))
            .sum();
        let requests = self.finished_requests + self.active.len() as u64;
        ProgressSnapshot {
            bytes: self.finished_bytes + active_bytes,
            total: self.share_size.saturating_mul(requests),
        }
    }
}

/// Convert an elapsed span to whole milliseconds.
///
/// Anything that actually moved reports at least 1ms: a transfer small enough
/// to finish inside a millisecond still happened, and 0 reads as "unknown".
pub fn duration_ms(elapsed_secs: f64) -> u64 {
    if elapsed_secs <= 0.0 {
        return 0;
    }
    ((elapsed_secs * 1000.0).round() as u64).max(1)
}

/// Wall time a share session spent serving requests.
///
/// Measured from the first request to the last one finishing — not from the
/// first payload byte, which for a small file lands in the same microsecond as
/// the last one.
#[derive(Debug, Default)]
pub struct TransferClock {
    started_secs: Option<f64>,
    last_secs: f64,
}

impl TransferClock {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn mark_start(&mut self, at_secs: f64) {
        if self.started_secs.is_none() {
            self.started_secs = Some(at_secs);
            self.last_secs = at_secs;
        }
    }

    pub fn mark_activity(&mut self, at_secs: f64) {
        if self.started_secs.is_some() {
            self.last_secs = self.last_secs.max(at_secs);
        }
    }

    pub fn duration_ms(&self) -> u64 {
        match self.started_secs {
            Some(started) => duration_ms((self.last_secs - started).max(0.0)).max(1),
            None => 0,
        }
    }
}

/// Rate-limits progress emission so a transfer does not flood the UI bridge.
pub struct EmitThrottle {
    min_bytes: u64,
    min_secs: f64,
    last: Option<(f64, u64)>,
}

impl EmitThrottle {
    pub fn new(min_bytes: u64, min_secs: f64) -> Self {
        Self {
            min_bytes,
            min_secs,
            last: None,
        }
    }

    pub fn should_emit(&mut self, at_secs: f64, bytes: u64) -> bool {
        let allow = match self.last {
            None => true,
            Some((last_secs, last_bytes)) => {
                bytes.saturating_sub(last_bytes) >= self.min_bytes
                    || at_secs - last_secs >= self.min_secs
            }
        };
        if allow {
            self.last = Some((at_secs, bytes));
        }
        allow
    }
}

/// Wire format shared by `transfer-progress` and `receive-progress`.
pub fn format_progress_payload(bytes: u64, total: u64, speed_bps: f64) -> String {
    format!("{}:{}:{}", bytes, total, (speed_bps * 1000.0) as i64)
}

#[cfg(test)]
mod tests {
    use super::*;

    const MB: u64 = 1024 * 1024;

    #[test]
    fn split_child_sizes_excludes_the_root_and_metadata_blobs() {
        assert_eq!(
            split_child_sizes(64, &[500, 1000, 2000]),
            PayloadSizes {
                overhead_bytes: 564,
                payload_bytes: 3000,
            }
        );
    }

    #[test]
    fn split_child_sizes_handles_a_collection_without_files() {
        assert_eq!(
            split_child_sizes(32, &[500]),
            PayloadSizes {
                overhead_bytes: 532,
                payload_bytes: 0,
            }
        );
    }

    #[test]
    fn split_child_sizes_handles_an_empty_size_list() {
        assert_eq!(
            split_child_sizes(32, &[]),
            PayloadSizes {
                overhead_bytes: 32,
                payload_bytes: 0,
            }
        );
    }

    #[test]
    fn speed_meter_reports_zero_until_the_window_spans_real_time() {
        let mut meter = SpeedMeter::new(3.0);
        meter.record(0.0, 0);
        assert_eq!(meter.bytes_per_sec_at(0.0), 0.0);

        meter.record(0.01, MB);
        assert_eq!(
            meter.bytes_per_sec_at(0.01),
            0.0,
            "a 10ms window is send-buffer noise, not a rate"
        );
    }

    #[test]
    fn speed_meter_measures_rate_across_the_window() {
        let mut meter = SpeedMeter::new(3.0);
        meter.record(0.0, 0);
        meter.record(1.0, MB);
        meter.record(2.0, 2 * MB);

        assert_eq!(meter.bytes_per_sec_at(2.0), MB as f64);
    }

    #[test]
    fn speed_meter_forgets_samples_older_than_the_window() {
        let mut meter = SpeedMeter::new(2.0);
        // 10 MB/s burst (a full send buffer), then a steady 1 MB/s.
        meter.record(0.0, 0);
        meter.record(1.0, 10 * MB);
        meter.record(2.0, 11 * MB);
        meter.record(3.0, 12 * MB);
        meter.record(4.0, 13 * MB);

        assert_eq!(
            meter.bytes_per_sec_at(4.0),
            MB as f64,
            "the opening burst must age out of the window"
        );
    }

    #[test]
    fn speed_meter_decays_while_the_transfer_is_stalled() {
        let mut meter = SpeedMeter::new(3.0);
        meter.record(0.0, 0);
        meter.record(1.0, MB);

        let live = meter.bytes_per_sec_at(1.0);
        let stalled = meter.bytes_per_sec_at(5.0);
        assert!(
            stalled < live / 2.0,
            "stalled speed {stalled} should fall well below {live}"
        );
    }

    #[test]
    fn request_progress_ignores_hash_seq_and_metadata_blobs() {
        let mut progress = RequestProgress::new();
        progress.blob_started(0, 64);
        progress.blob_progress(64);
        progress.blob_started(1, 500);
        progress.blob_progress(500);

        assert_eq!(progress.payload_bytes(), 0);
    }

    #[test]
    fn request_progress_sums_offsets_of_payload_blobs() {
        let mut progress = RequestProgress::new();
        progress.blob_started(2, 100);
        progress.blob_progress(100);
        progress.blob_started(3, 200);
        progress.blob_progress(150);

        assert_eq!(progress.payload_bytes(), 250);
    }

    #[test]
    fn request_progress_does_not_credit_bytes_a_blob_never_sent() {
        // Regression for issue #166: crediting a whole blob when the next one
        // starts inflates the sender's counter past what went on the wire.
        let mut progress = RequestProgress::new();
        progress.blob_started(2, 100);
        progress.blob_progress(30);
        progress.blob_started(3, 200);
        progress.blob_progress(10);

        assert_eq!(progress.payload_bytes(), 40);
    }

    #[test]
    fn request_progress_clamps_an_offset_to_the_blob_size() {
        let mut progress = RequestProgress::new();
        progress.blob_started(2, 100);
        progress.blob_progress(4096);

        assert_eq!(progress.payload_bytes(), 100);
    }

    #[test]
    fn request_progress_keeps_the_highest_offset_seen_for_a_blob() {
        let mut progress = RequestProgress::new();
        progress.blob_started(2, 100);
        progress.blob_progress(80);
        progress.blob_progress(20);

        assert_eq!(progress.payload_bytes(), 80);
    }

    #[test]
    fn request_progress_ignores_offsets_before_any_blob_started() {
        let mut progress = RequestProgress::new();
        progress.blob_progress(1000);

        assert_eq!(progress.payload_bytes(), 0);
    }

    #[test]
    fn share_progress_reports_one_request_against_the_share_size() {
        let mut share = ShareProgress::new(1000);
        let key = (1, 1);
        share.blob_started(key, 2, 1000);
        share.blob_progress(key, 400);

        assert_eq!(
            share.snapshot(),
            ProgressSnapshot {
                bytes: 400,
                total: 1000
            }
        );
    }

    #[test]
    fn share_progress_scales_the_total_with_concurrent_requests() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 1000);
        share.blob_progress((1, 1), 400);
        share.blob_started((2, 1), 2, 1000);
        share.blob_progress((2, 1), 100);

        assert_eq!(
            share.snapshot(),
            ProgressSnapshot {
                bytes: 500,
                total: 2000
            },
            "two peers pulling the same share is 2x the work, not 150% of one"
        );
    }

    #[test]
    fn share_progress_does_not_move_backwards_when_a_request_finishes() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 1000);
        share.blob_progress((1, 1), 1000);
        share.blob_started((2, 1), 2, 1000);
        share.blob_progress((2, 1), 300);

        let before = share.snapshot();
        share.retire((1, 1), true);
        let after = share.snapshot();

        assert_eq!(before, after);
        assert_eq!(share.active_requests(), 1);
    }

    #[test]
    fn share_progress_forgets_a_peer_that_gave_up() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 1000);
        share.blob_progress((1, 1), 50);
        share.retire((1, 1), false);

        share.blob_started((2, 1), 2, 1000);
        share.blob_progress((2, 1), 1000);

        assert_eq!(
            share.snapshot(),
            ProgressSnapshot {
                bytes: 1000,
                total: 1000
            },
            "an abandoned request must not hold the session below 100%"
        );
    }

    #[test]
    fn share_progress_counts_a_request_that_has_not_reported_a_blob_yet() {
        let mut share = ShareProgress::new(1000);
        share.ensure_request((1, 1));

        assert_eq!(share.active_requests(), 1);
        assert_eq!(
            share.snapshot(),
            ProgressSnapshot {
                bytes: 0,
                total: 1000
            }
        );
    }

    #[test]
    fn share_progress_retire_returns_the_bytes_of_that_request() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 1000);
        share.blob_progress((1, 1), 700);

        assert_eq!(share.retire((1, 1), true), 700);
    }

    #[test]
    fn share_progress_retire_reports_bytes_even_when_abandoned() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 1000);
        share.blob_progress((1, 1), 700);

        assert_eq!(share.retire((1, 1), false), 700);
        assert_eq!(share.active_requests(), 0);
    }

    #[test]
    fn share_progress_never_exceeds_its_total() {
        let mut share = ShareProgress::new(1000);
        share.blob_started((1, 1), 2, 4000);
        share.blob_progress((1, 1), 4000);

        let snapshot = share.snapshot();
        assert!(
            snapshot.bytes <= snapshot.total,
            "{snapshot:?} must not exceed 100%"
        );
    }

    #[test]
    fn duration_ms_rounds_to_whole_milliseconds() {
        assert_eq!(duration_ms(1.5), 1500);
        assert_eq!(duration_ms(0.0), 0);
    }

    #[test]
    fn duration_ms_never_reports_zero_for_a_span_that_elapsed() {
        assert_eq!(
            duration_ms(0.0004),
            1,
            "a sub-millisecond transfer still took time; 0 reads as unknown"
        );
    }

    #[test]
    fn transfer_clock_reports_nothing_before_a_request_arrives() {
        assert_eq!(TransferClock::new().duration_ms(), 0);
    }

    #[test]
    fn transfer_clock_measures_from_the_request_to_the_last_activity() {
        let mut clock = TransferClock::new();
        clock.mark_start(1.0);
        clock.mark_activity(1.25);
        clock.mark_activity(3.0);

        assert_eq!(clock.duration_ms(), 2000);
    }

    #[test]
    fn transfer_clock_reports_a_small_file_that_finished_immediately() {
        // Regression: a payload written in one go left first == last byte, so
        // the sender reported a 0ms transfer and the UI showed "NA".
        let mut clock = TransferClock::new();
        clock.mark_start(1.0);
        clock.mark_activity(1.0);

        assert_eq!(clock.duration_ms(), 1);
    }

    #[test]
    fn transfer_clock_keeps_the_first_start_across_several_peers() {
        let mut clock = TransferClock::new();
        clock.mark_start(1.0);
        clock.mark_start(2.0);
        clock.mark_activity(5.0);

        assert_eq!(clock.duration_ms(), 4000);
    }

    #[test]
    fn emit_throttle_always_allows_the_first_update() {
        let mut throttle = EmitThrottle::new(MB, 0.25);
        assert!(throttle.should_emit(0.0, 0));
    }

    #[test]
    fn emit_throttle_suppresses_small_rapid_updates() {
        let mut throttle = EmitThrottle::new(MB, 0.25);
        throttle.should_emit(0.0, 0);

        assert!(!throttle.should_emit(0.01, 64 * 1024));
        assert!(!throttle.should_emit(0.02, 128 * 1024));
    }

    #[test]
    fn emit_throttle_allows_an_update_once_enough_bytes_moved() {
        let mut throttle = EmitThrottle::new(MB, 0.25);
        throttle.should_emit(0.0, 0);

        assert!(throttle.should_emit(0.01, MB));
    }

    #[test]
    fn emit_throttle_allows_an_update_on_a_slow_link_after_the_time_floor() {
        let mut throttle = EmitThrottle::new(MB, 0.25);
        throttle.should_emit(0.0, 0);

        assert!(
            throttle.should_emit(0.5, 1024),
            "a slow transfer still needs a visible heartbeat"
        );
    }

    #[test]
    fn progress_payload_is_colon_separated_with_fixed_point_speed() {
        assert_eq!(format_progress_payload(10, 100, 1.5), "10:100:1500");
    }
}
