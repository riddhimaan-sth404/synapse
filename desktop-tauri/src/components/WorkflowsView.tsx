import React, { useState } from 'react';
import { Shield, RefreshCw, Check, X, Bot } from 'lucide-react';

interface ApprovalItem {
  id: string;
  tool: string;
  target: string;
  riskTier: string;
  command: string;
}

interface AuditItem {
  action: string;
  details: string;
  time: string;
}

export const WorkflowsView: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [auditEvents] = useState<AuditItem[]>([]);

  const handleResolve = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div style={{ maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '23px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Workflows &amp; Citadel
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Multi-agent graphs, specialist coding sessions, HITL approvals, and audit ledger.
          </p>
        </div>

        <button className="ui-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Runtime Status Card */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--accent)" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Citadel Runtime Health</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px' }}>
          Synapse Core Axum server and LangGraph supervised worker are operational on loopback (127.0.0.1). Policy verification and append-only cryptographic ledger active.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div className="status-chip" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
            <span className="dot-indicator" />
            <span>Citadel Healthy</span>
          </div>
          <div className="status-chip" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
            <span className="dot-indicator" />
            <span>LangGraph Worker Ready</span>
          </div>
          <div className="status-chip">
            <span className="dot-indicator" />
            <span>JCode Harness Active</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div>
        <h2 className="settings-h2">Pending Approvals ({approvals.length})</h2>
        {approvals.length === 0 ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--stroke)',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}
          >
            Zero pending approvals. All execution gates are clear.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {approvals.map((app) => (
              <div
                key={app.id}
                style={{
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {app.tool}
                  </span>
                  <span className="inspector-badge-ok" style={{ backgroundColor: 'var(--warning-soft)', color: 'var(--warning)' }}>
                    Risk - {app.riskTier}
                  </span>
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Target: {app.target}
                </span>

                <div
                  style={{
                    backgroundColor: 'var(--surface-inset)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {app.command}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <button
                    className="ui-btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px' }}
                    onClick={() => handleResolve(app.id)}
                  >
                    <Check size={13} />
                    <span>Approve</span>
                  </button>
                  <button
                    className="ui-btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px' }}
                    onClick={() => handleResolve(app.id)}
                  >
                    <X size={13} />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specialist Agents */}
      <div>
        <h2 className="settings-h2">Specialist Coding Agents (JCode Harness)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { name: 'Analyst', desc: 'Codebase architecture survey, AST inspection, read-only analysis.' },
            { name: 'Security', desc: 'Vulnerability discovery, secret leakage check, boundary enforcement.' },
            { name: 'Dependency', desc: 'Package vulnerability scanning, version parity verification.' },
            { name: 'Documentation', desc: 'API doc generation, spec synchronization, comment extraction.' },
          ].map((agent) => (
            <div
              key={agent.name}
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--stroke)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'start',
                gap: '10px',
              }}
            >
              <div className="card-icon-box" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                <Bot size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.name} Specialist
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {agent.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Audit Trail */}
      <div>
        <h2 className="settings-h2">Recent Cryptographic Audit Events ({auditEvents.length})</h2>
        {auditEvents.length === 0 ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--stroke)',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}
          >
            Zero audit events recorded in current session. Actions and tool probes will append cryptographic proofs here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {auditEvents.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: 'var(--accent)',
                    }}
                  >
                    [{item.action}]
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{item.details}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
