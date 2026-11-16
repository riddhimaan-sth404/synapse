# Synapse Threat Model & Security Specification
**Baseline Architecture v1.0 - Section 13 Alignment**

## 1. System Scope & Trust Boundaries

Synapse runs as a polyglot AI platform with two primary deployment profiles:
1. **Desktop Deployment**: Single-user workstation (Windows, Linux, macOS)
2. **Server / Hosted Deployment**: Multi-tenant team environment

```
+-------------------------------------------------------------------------------+
| UNTRUSTED EXTERNAL WORLD                                                      |
|   - Untrusted Browser Pages / Malicious Web Content                           |
|   - Untrusted Workspace Code & Dependency Manifests                           |
|   - Model Generated Tool Calls & Prompt Injections                            |
+-------------------------------------------------------------------------------+
                                      |
                               [Security Gate]
                                      v
+-------------------------------------------------------------------------------+
| SYNAPSE SECURE LOCAL BOUNDARY                                                 |
|   - Loopback Only HTTP/gRPC (127.0.0.1)                                       |
|   - Constant-Time Token Authentication (X-Synapse-Token)                      |
|   - Owner-Restricted Directory ACLs (0700 / 0600)                             |
+-------------------------------------------------------------------------------+
                                      |
                           [Central Authorization]
                                      v
+-------------------------------------------------------------------------------+
| SYNAPSE CORE (Rust)                                                           |
|   - Citadel Policy Evaluator & Hash-Chained Audit Ledger                      |
|   - Human-in-the-Loop (HITL) Approval Enforcement                             |
|   - Path Confinement & Credential Redaction Broker                            |
+-------------------------------------------------------------------------------+
         |                              |                               |
  [Strict Sandbox]               [Strict Sandbox]               [Strict Sandbox]
         v                              v                               v
+------------------+           +------------------+           +-----------------+
| LangGraph Worker |           |   JCode Harness  |           |  Browser Worker |
| (Python gRPC)    |           |   (Rust SDK)     |           |  (Go / Driver)  |
+------------------+           +------------------+           +-----------------+
```

## 2. Threat Vectors & Defenses

### Threat 1: Malicious Browser Web Content (DNS Rebinding & CSRF)
- **Attack**: A user browses to an attacker-controlled site that attempts to send HTTP requests to `localhost:3001` or `127.0.0.1:3001` to trigger agent execution or read workspace files.
- **Defense**:
  1. Strict Host header checking (`Host: 127.0.0.1` or `Host: localhost`); non-loopback hosts are rejected.
  2. Mandatory `X-Synapse-Token` (256-bit OS-random hex token) required on all API and RPC routes. Browsers cannot set custom headers cross-origin without preflight CORS permission.
  3. Narrowed loopback-only CORS headers.

### Threat 2: Untrusted Workspace Content & Path Traversal
- **Attack**: An LLM is tricked into requesting files outside the workspace root (e.g., `../../.ssh/id_rsa`, `/etc/passwd`, Windows registry).
- **Defense**:
  1. Path canonicalization and confinement check: `target.canonicalize().starts_with(workspace_root)`. Traversal attempts fail closed.
  2. Blocklist of sensitive paths (`.ssh`, `.aws`, `.gnupg`, `.git`, `.synapse`, `credentials`).
  3. Automated regex redaction of AWS keys, Slack tokens, JWTs, PEM private keys, and Google tokens before file content is returned to LLM context.

### Threat 3: Unauthorized Tool & Action Execution
- **Attack**: An autonomous agent invokes destructive tools (e.g. system commands, file deletion, network probes).
- **Defense**:
  1. Synapse Core acts as the centralized tool broker. Child runtimes cannot self-authorize tools.
  2. Critical tools require explicit human approval via the Citadel HITL gate.
  3. All tool invocations and results are recorded in an append-only, SHA-256 hash-chained audit ledger.
