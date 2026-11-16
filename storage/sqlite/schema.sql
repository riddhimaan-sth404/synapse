-- ==============================================================================
-- Synapse Desktop SQLite Schema (v1.0)
-- Embedded local persistence for application config, workspaces, sessions,
-- memory, and durable checkpoints.
-- ==============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Application configuration & feature flags
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Workspace metadata & path confinement roots
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    is_confined INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_opened_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Execution sessions (both LangGraph workflows and JCode coding agents)
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    workspace_id TEXT,
    runtime_type TEXT NOT NULL, -- 'langgraph' | 'jcode' | 'browser' | 'docling'
    role TEXT NOT NULL,
    status TEXT NOT NULL, -- 'created' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled'
    prompt TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

-- Durable checkpoints for workflow interruption and resumption
CREATE TABLE IF NOT EXISTS checkpoints (
    checkpoint_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    node_name TEXT NOT NULL,
    state_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- Dynamic tool registry & MCP registrations
CREATE TABLE IF NOT EXISTS tool_registry (
    name TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'readonly_workspace' | 'mcp' | 'browser' | 'docling'
    description TEXT NOT NULL,
    input_schema_json TEXT NOT NULL,
    requires_approval INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    endpoint_url TEXT,
    registered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Persistent agent memory (Episodic & Semantic)
CREATE TABLE IF NOT EXISTS memory_records (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    memory_type TEXT NOT NULL, -- 'episodic' | 'semantic' | 'user_preference'
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
);

-- Full-text search virtual table for fast local memory lookup
CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
    id UNINDEXED,
    content,
    category,
    tokenize = 'porter unicode61'
);

-- Triggers to maintain FTS index
CREATE TRIGGER IF NOT EXISTS memory_records_ai AFTER INSERT ON memory_records BEGIN
    INSERT INTO memory_fts(id, content, category) VALUES (new.id, new.content, new.category);
END;

CREATE TRIGGER IF NOT EXISTS memory_records_ad AFTER DELETE ON memory_records BEGIN
    DELETE FROM memory_fts WHERE id = old.id;
END;
