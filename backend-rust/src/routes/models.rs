use axum::{
    extract::State,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use crate::routes::auth::AppState;

#[derive(Debug, Deserialize)]
pub struct ModelCompletionRequest {
    pub model: String,
    pub prompt: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/complete", post(model_completion))
        .route("/usage", get(model_usage))
}

async fn model_completion(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ModelCompletionRequest>,
) -> Json<Value> {
    match state.model_gateway.complete(&req.model, &req.prompt).await {
        Ok(result) => Json(result),
        Err(err) => Json(json!({ "error": err })),
    }
}

async fn model_usage(
    State(state): State<Arc<AppState>>,
) -> Json<Value> {
    let stats = state.model_gateway.get_stats().await;
    Json(serde_json::to_value(stats).unwrap_or_default())
}
