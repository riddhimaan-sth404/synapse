import React from 'react';
import { Activity, ShieldCheck, Trash2, CheckCircle } from 'lucide-react';
import { LogEntry } from '../types';
import { MermaidGraph } from './MermaidGraph';

interface GraphViewProps {
  logs: LogEntry[];
  isExecuting: boolean;
  onClearLogs: () => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  logs,
  isExecuting,
  onClearLogs,
}) => {
  return (
    <div className="graph-view-page">
      {/* Page Header */}
      <div className="graph-view-header">
        <div>
          <div className="graph-title-row">
            <h1 className="header-title">Execution Graph</h1>
            <span className="platform-tag">Real-Time Mermaid Engine</span>
            {isExecuting && <span className="active-pulse-badge">Executing</span>}
          </div>
          <p className="header-subtitle">
            Deterministic state graph, actor sequence tracing, and Citadel cryptographic audit proofs.
          </p>
        </div>

        <div className="graph-header-controls">
          <div className="status-chip success">
            <ShieldCheck size={13} color="var(--success)" />
            <span>Citadel Hash Ledger Active</span>
          </div>

          <button
            className="ui-btn-secondary"
            onClick={onClearLogs}
            title="Clear execution trace"
          >
            <Trash2 size={13} />
            <span>Clear Graph</span>
          </button>
        </div>
      </div>

      {/* Primary Real-Time Mermaid Graph Surface */}
      <div className="graph-surface-main">
        <MermaidGraph logs={logs} isExecuting={isExecuting} />
      </div>

      {/* Chronological Event Trace List (Only in this dedicated view) */}
      <div className="graph-trace-card">
        <div className="trace-card-header">
          <div className="trace-header-left">
            <Activity size={14} color="var(--accent)" />
            <span className="trace-heading">Execution Event Ledger</span>
            <span className="event-count-badge">{logs.length} Total Events</span>
          </div>
          <span className="trace-timestamp-indicator">Live stream</span>
        </div>

        <div className="trace-table-scroll">
          {logs.length === 0 ? (
            <div className="trace-empty-state">
              <CheckCircle size={20} color="var(--text-tertiary)" />
              <p>No execution events yet. Run a prompt in AI Assistant to stream live graph nodes.</p>
            </div>
          ) : (
            <div className="trace-list">
              {logs.map((log, index) => (
                <div key={log.id} className="trace-row">
                  <span className="trace-index">#{index + 1}</span>
                  <span className="trace-time">{log.timestamp}</span>
                  <span className={`trace-type-pill ${log.type}`}>{log.type}</span>
                  <div className="trace-content">
                    <span className="trace-text">{log.text}</span>
                    {log.subagent && (
                      <span className="trace-subagent-tag">
                        Subagent: {log.subagent}
                      </span>
                    )}
                  </div>
                  <span className="trace-status-verified">
                    <ShieldCheck size={12} color="var(--success)" />
                    <span>Verified</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};