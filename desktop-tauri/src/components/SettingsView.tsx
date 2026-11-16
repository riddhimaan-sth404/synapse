import React, { useState } from 'react';
import { Briefcase, Code } from 'lucide-react';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

export const SettingsView: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<'knowledge' | 'software'>('software');
  const [permissionPreset, setPermissionPreset] = useState('Turbo');
  const [queuedMessages, setQueuedMessages] = useState<'queue' | 'immediate'>('immediate');
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [backendUrl, setBackendUrl] = useState('http://127.0.0.1:3001');

  const presetOptions: DropdownOption[] = [
    { value: 'Turbo', label: 'Turbo', subtext: 'Auto-approves safe sandbox commands' },
    { value: 'Standard', label: 'Standard', subtext: 'Prompts for terminal actions' },
    { value: 'Strict', label: 'Strict', subtext: 'Human approval on all actions' },
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div>
        <h1 className="settings-h1">General</h1>
        <p className="settings-sub">
          Configure agent execution, queued message delivery, and permissions.
        </p>
      </div>

      {/* Interface Layout */}
      <div>
        <h2 className="settings-h2">Interface Layout</h2>
        <div className="layout-card-grid">
          {/* Knowledge Work Card */}
          <div
            className={`selectable-layout-card ${layoutMode === 'knowledge' ? 'selected' : ''}`}
            onClick={() => setLayoutMode('knowledge')}
          >
            <div className="card-icon-box">
              <Briefcase size={17} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Knowledge Work</span>
                {layoutMode === 'knowledge' && <span className="dot-indicator" />}
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', lineHeight: '16px' }}>
                Simplified interface for research, writing, and everyday tasks.
              </p>
            </div>
          </div>

          {/* Software Engineering Card */}
          <div
            className={`selectable-layout-card ${layoutMode === 'software' ? 'selected' : ''}`}
            onClick={() => setLayoutMode('software')}
          >
            <div className="card-icon-box accent-box">
              <Code size={17} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Software Engineering</span>
                {layoutMode === 'software' && <span className="dot-indicator" />}
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', lineHeight: '16px' }}>
                Full interface for coding, developer tools, and managing agents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Permissions */}
      <div>
        <h2 className="settings-h2">Global Permissions</h2>
        <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          Configure global allowed and denied resource permissions. Learn more.
        </p>

        <div className="settings-section-card">
          <div className="settings-row">
            <div>
              <div className="row-label">Permission Preset</div>
              <div className="row-desc">Controls the actions the agent can take.</div>
            </div>
            <CustomDropdown
              options={presetOptions}
              value={permissionPreset}
              onChange={setPermissionPreset}
              width="180px"
            />
          </div>

          <div className="divider" style={{ margin: '2px 0' }} />

          <div className="settings-row">
            <div>
              <div className="row-label">Tool Permissions</div>
              <div className="row-desc">Modify permissions for file, terminal, and MCP tools.</div>
            </div>
            <button className="ui-btn-secondary">Open</button>
          </div>

          <div className="divider" style={{ margin: '2px 0' }} />

          <div className="settings-row">
            <div>
              <div className="row-label">Network Access Rules</div>
              <div className="row-desc">Configure allowed and denied URLs for reading.</div>
            </div>
            <button className="ui-btn-secondary">Open</button>
          </div>
        </div>
      </div>

      {/* Execution */}
      <div>
        <h2 className="settings-h2">Execution</h2>
        <div className="settings-section-card">
          <div className="settings-row">
            <div>
              <div className="row-label">Queued Messages</div>
              <div className="row-desc">Configure when follow-up messages are sent.</div>
            </div>
            <div className="segmented-pill">
              <button
                className={`segmented-item ${queuedMessages === 'queue' ? 'active' : ''}`}
                onClick={() => setQueuedMessages('queue')}
              >
                Queue
              </button>
              <button
                className={`segmented-item ${queuedMessages === 'immediate' ? 'active' : ''}`}
                onClick={() => setQueuedMessages('immediate')}
              >
                Send Immediately
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Mode */}
      <div>
        <h2 className="settings-h2">Voice mode</h2>
        <div className="settings-section-card">
          <div className="settings-row">
            <div>
              <div className="row-label">Voice</div>
              <div className="row-desc">The voice used in Voice mode. Powered by Gemini Live.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Not set</span>
              <button className="ui-btn-secondary" style={{ padding: '4px 12px' }}>
                Change
              </button>
            </div>
          </div>

          <div className="divider" style={{ margin: '2px 0' }} />

          <div className="settings-row">
            <div>
              <div className="row-label">Microphone</div>
              <div className="row-desc">Input device for voice mode and dictation.</div>
            </div>
            <select className="standard-input" defaultValue="system">
              <option value="system">System default</option>
            </select>
          </div>

          <div className="divider" style={{ margin: '2px 0' }} />

          <div className="settings-row">
            <div>
              <div className="row-label">Volume</div>
              <div className="row-desc">How loud Synapse's voice is.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                style={{ width: '130px', accentColor: 'var(--accent)' }}
              />
              <span
                style={{
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  width: '35px',
                }}
              >
                {voiceVolume}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Backend Endpoint */}
      <div>
        <h2 className="settings-h2">Core Backend &amp; Node Identity</h2>
        <div className="settings-section-card">
          <div className="settings-row">
            <div>
              <div className="row-label">Server loopback URL</div>
              <div className="row-desc">Synapse Core Axum server endpoint.</div>
            </div>
            <input
              type="text"
              className="standard-input"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>

          <div className="divider" style={{ margin: '2px 0' }} />

          <div className="settings-row">
            <div>
              <div className="row-label">Hardware Machine ID</div>
              <div className="row-desc">Cryptographically bound node fingerprint.</div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-inset)',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              SYNAPSE-NODE-WIN32-8F92A
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
