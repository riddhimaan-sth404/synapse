use axum::{
    extract::State,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::sync::Arc;
use crate::routes::auth::AppState;
use crate::services::tool_broker::ToolEntry;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/list", get(list_tools))
        .route("/register", post(register_tool))
}

async fn list_tools(
    State(state): State<Arc<AppState>>,
) -> Json<Value> {
    let tools = state.tool_broker.list_tools().await;
    Json(json!({ "tools": tools }))
}

async fn register_tool(
    State(state): State<Arc<AppState>>,
    Json(entry): Json<ToolEntry>,
) -> Json<Value> {
    let name = entry.name.clone();
    state.tool_broker.register_mcp_tool(entry).await;
    Json(json!({ "registered": name, "ok": true }))
}
