# Synapse Cryptographic Audit Ledger Specification
**Baseline Architecture v1.0 - Section 13.4 Alignment**

## 1. Immutability & Hash Chain Guarantees

Every security-sensitive operation across all Synapse runtimes is recorded into the append-only cryptographic audit chain maintained by Citadel:

$$\text{RecordHash}_n = \text{SHA-256}\Big(\text{Index}_n \parallel \text{Timestamp}_n \parallel \text{SessionID}_n \parallel \text{Actor}_n \parallel \text{EventType}_n \parallel \text{PayloadHash}_n \parallel \text{RecordHash}_{n-1}\Big)$$

- The genesis record uses $\text{RecordHash}_0 = 0000000000000000000000000000000000000000000000000000000000000000$.
- Any modification, deletion, or truncation of historical records breaks the hash verification equation.

## 2. Event Types & Classification

| Event Type | Actor | Description | Required Fields |
| :--- | :--- | :--- | :--- |
| `agent_created` | User / Core | New agent workflow session created | `agent_id`, `role`, `workspace`, `objective_len` |
| `tool_invocation_requested`| Agent | Agent requests tool execution | `session_id`, `tool_name`, `sanitized_params` |
| `tool_invocation_authorized` | Citadel | Policy engine approves invocation | `session_id`, `tool_name`, `policy_id` |
| `tool_invocation_denied` | Citadel | Policy engine or human rejects invocation | `session_id`, `tool_name`, `reason` |
| `tool_invocation_completed` | Tool Broker | Tool finished execution | `session_id`, `tool_name`, `output_bytes`, `redacted` |
| `hitl_approval_requested` | Core | Human intervention required | `approval_id`, `session_id`, `action_type`, `risk_level` |
| `hitl_approval_resolved` | Human User | User approved or denied action | `approval_id`, `decision`, `decided_by` |
| `checkpoint_committed` | LangGraph | State checkpoint persisted | `session_id`, `checkpoint_id`, `step` |

## 3. Redaction in Audit Logs
To prevent credential leakage in the audit chain itself:
- Raw query contents or passwords must never be stored in `payload_json`.
- Only payload hashes, sanitized paths, and byte lengths are preserved.
