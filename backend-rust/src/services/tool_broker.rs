use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::info;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolEntry {
    pub name: String,
    pub category: String, // "readonly_workspace" | "mcp" | "browser" | "docling"
    pub description: String,
    pub requires_approval: bool,
    pub is_enabled: bool,
    pub endpoint_url: Option<String>,
}

pub struct ToolBroker {
    tools: Arc<Mutex<HashMap<String, ToolEntry>>>,
}

impl ToolBroker {
    pub fn new() -> Self {
        let mut registry = HashMap::new();
        
        // Register core built-in tools
        registry.insert("workspace_read".to_string(), ToolEntry {
            name: "workspace_read".to_string(),
            category: "readonly_workspace".to_string(),
            description: "Read UTF-8 source file up to 64 KiB with automated secret redaction".to_string(),
            requires_approval: false,
            is_enabled: true,
            endpoint_url: None,
        });

        registry.insert("workspace_list".to_string(), ToolEntry {
            name: "workspace_list".to_string(),
            category: "readonly_workspace".to_string(),
            description: "List directory contents with path confinement and sensitive entry hiding".to_string(),
            requires_approval: false,
            is_enabled: true,
            endpoint_url: None,
        });

        registry.insert("workspace_search".to_string(), ToolEntry {
            name: "workspace_search".to_string(),
            category: "readonly_workspace".to_string(),
            description: "Search workspace source files with regex secret redaction".to_string(),
            requires_approval: false,
            is_enabled: true,
            endpoint_url: None,
        });

        registry.insert("browser_navigate".to_string(), ToolEntry {
            name: "browser_navigate".to_string(),
            category: "browser".to_string(),
            description: "Navigate to approved public URL with origin restriction".to_string(),
            requires_approval: false,
            is_enabled: true,
            endpoint_url: Some("http://127.0.0.1:8096/api/v1/browser/task".to_string()),
        });

        registry.insert("document_parse".to_string(), ToolEntry {
            name: "document_parse".to_string(),
            category: "docling".to_string(),
            description: "Parse PDF or DOCX file into Markdown structured text".to_string(),
            requires_approval: false,
            is_enabled: true,
            endpoint_url: Some("http://127.0.0.1:8097/api/v1/documents/parse".to_string()),
        });

        Self {
            tools: Arc::new(Mutex::new(registry)),
        }
    }

    pub async fn list_tools(&self) -> Vec<ToolEntry> {
        let tools = self.tools.lock().await;
        tools.values().cloned().collect()
    }

    pub async fn register_mcp_tool(&self, entry: ToolEntry) {
        info!("[ToolBroker] Registering MCP tool: {}", entry.name);
        let mut tools = self.tools.lock().await;
        tools.insert(entry.name.clone(), entry);
    }

    pub async fn is_authorized(&self, tool_name: &str) -> (bool, bool) {
        let tools = self.tools.lock().await;
        if let Some(t) = tools.get(tool_name) {
            (t.is_enabled, t.requires_approval)
        } else {
            (false, true)
        }
    }
}
