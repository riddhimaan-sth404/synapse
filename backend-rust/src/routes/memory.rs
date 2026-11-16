use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{delete, get, post},
    Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use crate::routes::auth::AppState;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub memory_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddMemoryRequest {
    pub session_id: Option<String>,
    pub memory_type: String,
    pub category: String,
    pub content: String,
    pub metadata: Option<Value>,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_or_search_memory))
        .route("/add", post(add_memory))
        .route("/:id", delete(delete_memory))
}

async fn list_or_search_memory(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SearchQuery>,
) -> Json<Value> {
    let q = query.q.unwrap_or_default();
    let records = state.memory_service.search(&q, query.memory_type.as_deref()).await;
    Json(json!({ "records": records, "count": records.len() }))
}

async fn add_memory(
    State(state): State<Arc<AppState>>,
    Json(req): Json<AddMemoryRequest>,
) -> Json<Value> {
    let record = state.memory_service.add_record(
        req.session_id,
        &req.memory_type,
        &req.category,
        &req.content,
        req.metadata,
    ).await;
    Json(json!({ "ok": true, "record": record }))
}

async fn delete_memory(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Json<Value> {
    let deleted = state.memory_service.delete(&id).await;
    Json(json!({ "deleted": deleted, "id": id }))
}
