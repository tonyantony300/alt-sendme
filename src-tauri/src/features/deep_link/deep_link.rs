/// Deep Link URL parsing and handling module
/// Handles parsing of sendme:// scheme URLs and extracting action/ticket parameters
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Mutex;
use url::Url;

/// Maximum allowed length for ticket parameter
const MAX_TICKET_LENGTH: usize = 512;

/// Deep link payload sent to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeepLinkPayload {
    /// Action type (e.g., "receive", "send")
    pub action: String,
    /// Ticket parameter, if provided
    pub ticket: Option<String>,
    /// Extra metadata for future extensions
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<serde_json::Value>,
}

/// Deep link parser with deduplication
pub struct DeepLinkParser {
    /// Track recently processed URLs to prevent duplicates
    processed_urls: Mutex<HashSet<String>>,
}

impl DeepLinkParser {
    /// Create a new deep link parser
    pub fn new() -> Self {
        Self {
            processed_urls: Mutex::new(HashSet::new()),
        }
    }

    /// Parse a deep link URL and extract payload
    ///
    /// # Arguments
    /// * `url_str` - The deep link URL to parse (e.g., "sendme://receive?ticket=abc123")
    ///
    /// # Returns
    /// * `Ok(DeepLinkPayload)` - Successfully parsed payload
    /// * `Err(String)` - Error message if parsing fails
    pub fn parse(&self, url_str: &str) -> Result<DeepLinkPayload, String> {
        // Validate URL is not empty
        if url_str.trim().is_empty() {
            return Err("URL cannot be empty".to_string());
        }

        // Parse URL
        let url = Url::parse(url_str).map_err(|e| format!("Invalid URL: {}", e))?;

        // Validate scheme
        if url.scheme() != "sendme" {
            return Err(format!(
                "Invalid scheme: {}. Expected 'sendme'",
                url.scheme()
            ));
        }

        // Extract action from host
        let action = url.host_str().unwrap_or("").to_string();
        if action.is_empty() {
            return Err("Missing action in URL (should be sendme://action?...)".to_string());
        }

        // Validate action
        if !self.is_valid_action(&action) {
            return Err(format!("Invalid action: {}", action));
        }

        // Parse query parameters
        let mut ticket: Option<String> = None;
        let mut extra: Option<serde_json::Value> = None;

        for (key, value) in url.query_pairs() {
            match key.as_ref() {
                "ticket" => {
                    // Validate ticket length
                    if value.len() > MAX_TICKET_LENGTH {
                        return Err(format!(
                            "Ticket exceeds max length of {}",
                            MAX_TICKET_LENGTH
                        ));
                    }
                    ticket = Some(value.to_string());
                }
                _ => {
                    // Store extra parameters
                    if extra.is_none() {
                        extra = Some(serde_json::json!({}));
                    }
                    if let Some(obj) = extra.as_mut() {
                        if let serde_json::Value::Object(ref mut map) = obj {
                            map.insert(
                                key.to_string(),
                                serde_json::Value::String(value.to_string()),
                            );
                        }
                    }
                }
            }
        }

        Ok(DeepLinkPayload {
            action,
            ticket,
            extra,
        })
    }

    /// Check if URL has already been processed (deduplication)
    pub fn is_duplicate(&self, url: &str) -> bool {
        self.processed_urls.lock().unwrap().contains(url)
    }

    /// Mark URL as processed
    pub fn mark_processed(&self, url: String) {
        self.processed_urls.lock().unwrap().insert(url);
    }

    /// Validate if action is supported
    fn is_valid_action(&self, action: &str) -> bool {
        matches!(action, "receive" | "send")
    }
}

impl Default for DeepLinkParser {
    fn default() -> Self {
        Self::new()
    }
}
