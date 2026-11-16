use axum::{
    extract::State,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::Value;
use std::sync::Arc;
use crate::routes::auth::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(get_runtime_status))
        .route("/reap-idle", post(reap_idle_workers))
}

async fn get_runtime_status(
    State(state): State<Arc<AppState>>,
) -> Json<Value> {
    let workers = state.supervisor.status().await;
    Json(serde_json::to_value(workers).unwrap_or_default())
}

async fn reap_idle_workers(
    State(state): State<Arc<AppState>>,
) -> Json<Value> {
    let result = state.supervisor.reap_idle().await;
    Json(result)
}
