use serde::Serialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::info;

#[derive(Clone, Debug, Serialize)]
pub enum WorkerState {
    Stopped,
    Starting,
    Healthy,
    Degraded,
    Failed,
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkerDescriptor {
    pub name: String,
    pub runtime_type: String,
    pub endpoint_url: String,
    pub state: WorkerState,
    pub pid: Option<u32>,
    pub port: u16,
    pub idle_seconds: u64,
    pub crash_count: u32,
}

struct ManagedWorker {
    name: String,
    runtime_type: String,
    endpoint_url: String,
    port: u16,
    state: WorkerState,
    pid: Option<u32>,
    last_active: Instant,
    crash_count: u32,
    idle_timeout: Duration,
}

#[allow(dead_code)]
pub struct RuntimeSupervisor {
    root: PathBuf,
    workers: Arc<Mutex<HashMap<String, ManagedWorker>>>,
    client: reqwest::Client,
}

impl RuntimeSupervisor {
    pub fn new(root: PathBuf) -> Self {
        let mut initial_workers = HashMap::new();
        
        // Register default platform runtimes according to canonical architecture (Section 19)
        initial_workers.insert("citadel".to_string(), ManagedWorker {
            name: "citadel".to_string(),
            runtime_type: "rust_core".to_string(),
            endpoint_url: "http://127.0.0.1:8088".to_string(),
            port: 8088,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(86400), // Citadel runs continuously
        });

        initial_workers.insert("jcode".to_string(), ManagedWorker {
            name: "jcode".to_string(),
            runtime_type: "rust_harness".to_string(),
            endpoint_url: "http://127.0.0.1:8092".to_string(),
            port: 8092,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(1800), // 30 min idle reap
        });

        initial_workers.insert("langgraph".to_string(), ManagedWorker {
            name: "langgraph".to_string(),
            runtime_type: "python_worker".to_string(),
            endpoint_url: "http://127.0.0.1:8095".to_string(),
            port: 8095,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(1800),
        });

        initial_workers.insert("bifrost".to_string(), ManagedWorker {
            name: "bifrost".to_string(),
            runtime_type: "go_gateway".to_string(),
            endpoint_url: "http://127.0.0.1:8098".to_string(),
            port: 8098,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(1800),
        });

        initial_workers.insert("browser".to_string(), ManagedWorker {
            name: "browser".to_string(),
            runtime_type: "stagehand_go".to_string(),
            endpoint_url: "http://127.0.0.1:8096".to_string(),
            port: 8096,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(900), // 15 min idle reap
        });

        initial_workers.insert("docling".to_string(), ManagedWorker {
            name: "docling".to_string(),
            runtime_type: "python_docling".to_string(),
            endpoint_url: "http://127.0.0.1:8097".to_string(),
            port: 8097,
            state: WorkerState::Stopped,
            pid: None,
            last_active: Instant::now(),
            crash_count: 0,
            idle_timeout: Duration::from_secs(900),
        });

        Self {
            root,
            workers: Arc::new(Mutex::new(initial_workers)),
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(3))
                .build()
                .unwrap_or_default(),
        }
    }

    /// List statuses of all managed runtimes
    pub async fn status(&self) -> Vec<WorkerDescriptor> {
        let workers = self.workers.lock().await;
        workers.values().map(|w| {
            WorkerDescriptor {
                name: w.name.clone(),
                runtime_type: w.runtime_type.clone(),
                endpoint_url: w.endpoint_url.clone(),
                state: w.state.clone(),
                pid: w.pid,
                port: w.port,
                idle_seconds: w.last_active.elapsed().as_secs(),
                crash_count: w.crash_count,
            }
        }).collect()
    }

    /// Probe health and mark worker as active
    pub async fn touch_worker(&self, name: &str) {
        let mut workers = self.workers.lock().await;
        if let Some(w) = workers.get_mut(name) {
            w.last_active = Instant::now();
        }
    }

    /// Reap workers that have exceeded their idle threshold (Section 19.2)
    pub async fn reap_idle(&self) -> Value {
        let mut workers = self.workers.lock().await;
        let mut reaped = Vec::new();
        
        for (name, w) in workers.iter_mut() {
            if matches!(w.state, WorkerState::Healthy | WorkerState::Starting) {
                if w.last_active.elapsed() > w.idle_timeout {
                    info!("[Supervisor] Reaping idle worker '{}' after {}s inactive", name, w.last_active.elapsed().as_secs());
                    w.state = WorkerState::Stopped;
                    w.pid = None;
                    reaped.push(name.clone());
                }
            }
        }

        json!({
            "reaped_workers": reaped,
            "reaped_count": reaped.len()
        })
    }
}
