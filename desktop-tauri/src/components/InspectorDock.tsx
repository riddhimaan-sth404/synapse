import React from 'react';
import {
  Code2,
  FileCode2,
  Terminal,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { SubagentItem, BackgroundTaskItem, ArtifactItem } from '../types';

interface InspectorDockProps {
  isOpen: boolean;
  subagents?: SubagentItem[];
  backgroundTasks?: BackgroundTaskItem[];
  artifacts?: ArtifactItem[];
  diffStat?: { files: number; additions: number; deletions: number };
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
  isOpen,
  subagents = [],
  backgroundTasks = [],
  artifacts = [],
  diffStat = { files: 0, additions: 0, deletions: 0 },
}) => {
  return (
    <aside className={`inspector-dock ${isOpen ? '' : 'collapsed'}`}>
      {/* Overview Section */}
      <div className="inspector-section">
        <div className="inspector-section-header">
          <span className="sidebar-section-title" style={{ margin: 0 }}>
            Overview
          </span>
          <span className="inspector-badge-ok">
            +{diffStat.additions} -{diffStat.deletions}
          </span>
        </div>

        <button className="inspector-list-btn">
          <Code2 size={13} />
          <span>{diffStat.files > 0 ? `${diffStat.files} files modified` : 'No file changes'}</span>
        </button>
        <button className="inspector-list-btn">
          <FileCode2 size={13} />
          <span>Workspace confined</span>
        </button>
        <button className="inspector-list-btn">
          <Terminal size={13} />
          <span>Loopback: 127.0.0.1:3001</span>
        </button>
        <button className="inspector-list-btn">
          <ShieldCheck size={13} />
          <span>Citadel policy active</span>
        </button>
      </div>

      <div className="divider" />

      {/* Subagents Section */}
      <div className="inspector-section">
        <div className="inspector-section-header">
          <span className="sidebar-section-title" style={{ margin: 0 }}>
            Subagents
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
            {subagents.length}
          </span>
        </div>

        {subagents.length === 0 ? (
          <div className="inspector-empty-state">
            <CheckCircle size={14} color="var(--text-tertiary)" />
            <span>No active subagents. Dispatched on demand.</span>
          </div>
        ) : (
          subagents.map((sub, idx) => (
            <div key={idx} className="inspector-card-item">
              <div className="inspector-item-badge">
                <Code2 size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="item-title">{sub.name}</div>
                <div className="item-sub">{sub.runtime}</div>
              </div>
              <span className={`dot-indicator ${sub.status === 'running' ? '' : 'idle'}`} />
            </div>
          ))
        )}
      </div>

      <div className="divider" />

      {/* Background Tasks Section */}
      <div className="inspector-section">
        <div className="inspector-section-header">
          <span className="sidebar-section-title" style={{ margin: 0 }}>
            Background Tasks
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
            {backgroundTasks.length}
          </span>
        </div>

        {backgroundTasks.length === 0 ? (
          <div className="inspector-empty-state">
            <CheckCircle size={14} color="var(--text-tertiary)" />
            <span>No background tasks running.</span>
          </div>
        ) : (
          backgroundTasks.map((task, idx) => (
            <div key={idx} className="inspector-card-item">
              <span className="dot-indicator" style={{ marginRight: '2px' }} />
              <div>
                <div className="item-title">{task.name}</div>
                <div className="item-sub">{task.details}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="divider" />

      {/* Artifacts Section */}
      <div className="inspector-section">
        <div className="inspector-section-header">
          <span className="sidebar-section-title" style={{ margin: 0 }}>
            Artifacts
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
            {artifacts.length}
          </span>
        </div>

        {artifacts.length === 0 ? (
          <div className="inspector-empty-state">
            <CheckCircle size={14} color="var(--text-tertiary)" />
            <span>No artifacts generated in this session.</span>
          </div>
        ) : (
          artifacts.map((art, idx) => (
            <div key={idx} className="inspector-card-item">
              <div className="inspector-item-badge">
                <FileCode2 size={12} />
              </div>
              <div>
                <div className="item-title">{art.title}</div>
                <div className="item-sub">{art.version}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};