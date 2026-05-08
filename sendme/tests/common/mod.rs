#![allow(dead_code, unused_imports)]

use sendme::EventEmitter;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct MockEvent {
    pub name: String,
    pub payload: Option<String>,
}

#[derive(Debug, Default)]
pub struct MockEventEmitter {
    events: Mutex<Vec<MockEvent>>,
}

impl MockEventEmitter {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    /// Returns a clone of all captured events.
    pub fn events(&self) -> Vec<MockEvent> {
        self.events.lock().unwrap().clone()
    }

    /// Returns true if any event with the given name was emitted.
    pub fn has_event(&self, name: &str) -> bool {
        self.events.lock().unwrap().iter().any(|e| e.name == name)
    }

    /// Returns all event names in order.
    pub fn event_names(&self) -> Vec<String> {
        self.events
            .lock()
            .unwrap()
            .iter()
            .map(|e| e.name.clone())
            .collect()
    }

    /// Returns all events matching the given name.
    pub fn events_with_name(&self, name: &str) -> Vec<MockEvent> {
        self.events
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.name == name)
            .cloned()
            .collect()
    }
}

impl EventEmitter for MockEventEmitter {
    fn emit_event(&self, event_name: &str) -> Result<(), String> {
        self.events.lock().unwrap().push(MockEvent {
            name: event_name.to_string(),
            payload: None,
        });
        Ok(())
    }

    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String> {
        self.events.lock().unwrap().push(MockEvent {
            name: event_name.to_string(),
            payload: Some(payload.to_string()),
        });
        Ok(())
    }
}

/// Helper to manage temp directories and files for E2E tests.
pub struct TestFixture {
    pub dir: tempfile::TempDir,
}

impl TestFixture {
    pub fn new() -> Self {
        Self {
            dir: tempfile::TempDir::new().expect("failed to create temp dir"),
        }
    }

    /// Create a file with the given content, returns absolute path.
    pub fn create_file(&self, name: &str, content: &[u8]) -> PathBuf {
        let path = self.dir.path().join(name);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).expect("failed to create parent dirs");
        }
        std::fs::write(&path, content).expect("failed to write file");
        path
    }

    /// Create a large file filled with a deterministic pattern.
    pub fn create_large_file(&self, name: &str, size: usize) -> PathBuf {
        let data: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
        self.create_file(name, &data)
    }

    /// Create a directory with multiple files.
    /// `files` is a slice of (relative_path, content) tuples.
    pub fn create_dir_with_files(&self, dir_name: &str, files: &[(&str, &[u8])]) -> PathBuf {
        let dir_path = self.dir.path().join(dir_name);
        for (rel_path, content) in files {
            let file_path = dir_path.join(rel_path);
            if let Some(parent) = file_path.parent() {
                std::fs::create_dir_all(parent).expect("failed to create parent dirs");
            }
            std::fs::write(&file_path, content).expect("failed to write file");
        }
        dir_path
    }

    /// Returns a fresh output directory for receiving files.
    pub fn output_dir(&self) -> PathBuf {
        let out = self.dir.path().join("received");
        std::fs::create_dir_all(&out).expect("failed to create output dir");
        out
    }

    /// Returns a fresh named output directory for receiving files.
    /// Use this when a single test needs multiple independent receive directories.
    pub fn output_dir_named(&self, name: &str) -> PathBuf {
        let out = self.dir.path().join(name);
        std::fs::create_dir_all(&out).expect("failed to create output dir");
        out
    }
}
