//! mDNS lifecycle. The only module in the engine that touches multicast.
//!
//! Everything downstream consumes `NearbyRegistry`, which takes injected
//! observations — so the rest of the feature is testable without multicast.

use anyhow::Context;
use iroh::Endpoint;
use iroh_mdns_address_lookup::{DiscoveryEvent, MdnsAddressLookup};
use n0_future::StreamExt;
use tokio::sync::mpsc;

/// What the mDNS pump observed. Deliberately dumb: all policy lives in
/// `node.rs`, so nothing here needs a network to test.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LanEvent {
    Appeared { endpoint_id: String },
    Vanished { endpoint_id: String },
}

pub struct LanDiscovery {
    task: tokio::task::JoinHandle<()>,
}

impl LanDiscovery {
    /// Registers the mDNS publisher on `endpoint` and pumps sightings into `tx`.
    ///
    /// Failure is not fatal (no multicast, VPN, isolated guest network) — the
    /// app keeps working with pairing codes and relays.
    pub fn start(endpoint: &Endpoint, tx: mpsc::UnboundedSender<LanEvent>) -> anyhow::Result<Self> {
        let mdns = MdnsAddressLookup::builder()
            .build(endpoint.id())
            .context("build mDNS address lookup")?;

        endpoint
            .address_lookup()
            .context("endpoint has no address lookup registry")?
            .add(mdns.clone());

        // Answers "is this device advertising at all?" — the first question in
        // every "the other device can't see me" report.
        tracing::debug!(
            target: "dashbeam::_events::nearby::mdns_advertising",
            local = %endpoint.id().fmt_short(),
        );

        let task = tokio::spawn(async move {
            let mut events = mdns.subscribe().await;
            while let Some(event) = events.next().await {
                let mapped = match event {
                    DiscoveryEvent::Discovered { endpoint_info, .. } => {
                        tracing::debug!(
                            target: "dashbeam::_events::nearby::mdns_discovered",
                            remote = %endpoint_info.endpoint_id.fmt_short(),
                        );
                        LanEvent::Appeared {
                            endpoint_id: endpoint_info.endpoint_id.to_string(),
                        }
                    }
                    DiscoveryEvent::Expired { endpoint_id } => {
                        tracing::debug!(
                            target: "dashbeam::_events::nearby::mdns_expired",
                            remote = %endpoint_id.fmt_short(),
                        );
                        LanEvent::Vanished {
                            endpoint_id: endpoint_id.to_string(),
                        }
                    }
                    // `DiscoveryEvent` is `#[non_exhaustive]`. Logged so an
                    // upstream addition doesn't look like multicast went quiet.
                    _ => {
                        tracing::debug!(
                            target: "dashbeam::_events::nearby::mdns_unhandled",
                            "unrecognised mDNS discovery event",
                        );
                        continue;
                    }
                };
                // Receiver gone means the node is shutting down.
                if tx.send(mapped).is_err() {
                    break;
                }
            }
            tracing::debug!(
                target: "dashbeam::_events::nearby::mdns_pump_stopped",
                "mDNS event pump exited",
            );
        });

        Ok(Self { task })
    }

    pub fn shutdown(self) {
        tracing::debug!(
            target: "dashbeam::_events::nearby::mdns_shutdown",
            "stopping mDNS advertising",
        );
        self.task.abort();
    }
}
