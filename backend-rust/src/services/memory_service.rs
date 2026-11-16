use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::Utc;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MemoryRecord {
    pub id: String,
    pub session_id: Option<String>,
    pub memory_type: String, // "episodic" | "semantic" | "user_preference"
    pub category: String,
    pub content: String,
    pub metadata: Value,
    pub created_at: String,
}

pub struct MemoryService {
    records: Arc<Mutex<Vec<MemoryRecord>>>,
}

impl MemoryService {
    pub fn new() -> Self {
        Self {
            records: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub async fn add_record(
        &self,
        session_id: Option<String>,
        memory_type: &str,
        category: &str,
        content: &str,
        metadata: Option<Value>,
    ) -> MemoryRecord {
        let token = crate::routes::auth::generate_local_token();
        let record = MemoryRecord {
            id: format!("mem-{}", &token[..16]),
            session_id,
            memory_type: memory_type.to_string(),
            category: category.to_string(),
            content: content.to_string(),
            metadata: metadata.unwrap_or_else(|| json!({})),
            created_at: Utc::now().to_rfc3339(),
        };

        let mut records = self.records.lock().await;
        records.push(record.clone());
        record
    }

    pub async fn search(&self, query: &str, memory_type: Option<&str>) -> Vec<MemoryRecord> {
        let q = query.to_lowercase();
        let records = self.records.lock().await;
        records.iter().filter(|r| {
            let matches_type = memory_type.map(|t| r.memory_type == t).unwrap_or(true);
            let matches_query = q.is_empty() || r.content.to_lowercase().contains(&q) || r.category.to_lowercase().contains(&q);
            matches_type && matches_query
        }).cloned().collect()
    }

    pub async fn list(&self) -> Vec<MemoryRecord> {
        let records = self.records.lock().await;
        records.clone()
    }

    pub async fn delete(&self, id: &str) -> bool {
        let mut records = self.records.lock().await;
        let initial_len = records.len();
        records.retain(|r| r.id != id);
        records.len() < initial_len
    }

    pub async fn clear(&self) {
        let mut records = self.records.lock().await;
        records.clear();
    }
}
