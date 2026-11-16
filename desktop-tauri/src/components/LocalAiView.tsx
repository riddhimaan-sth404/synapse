import React, { useState } from 'react';
import { Zap, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

export const LocalAiView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Real local model options - check if any GGUF exists
  const modelOptions: DropdownOption[] = [
    {
      value: 'smollm2-135m',
      label: 'SmolLM2 135M Instruct',
      subtext: 'DirectML / GGUF (95 MB)',
      badge: 'Not installed',
      badgeType: 'warning',
      icon: <Cpu size={14} />,
    },
    {
      value: 'qwen2.5-coder-7b',
      label: 'Qwen 2.5 Coder 7B',
      subtext: 'DirectML / GGUF (4.4 GB)',
      badge: 'Not installed',
      badgeType: 'warning',
      icon: <Cpu size={14} />,
    },
    {
      value: 'llama3.2-3b',
      label: 'Llama 3.2 3B Instruct',
      subtext: 'CPU / GGUF (2.0 GB)',
      badge: 'Not installed',
      badgeType: 'warning',
      icon: <Cpu size={14} />,
    },
  ];

  return (
    <div style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '23px', fontWeight: 600, color: 'var(--text-primary)' }}>Local AI</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Offline inference via local llama-server (127.0.0.1:8080) or Ollama (127.0.0.1:11434).
          </p>
        </div>

        <button className="ui-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={13} />
          <span>Rescan Local Engine</span>
        </button>
      </div>

      {/* Offline Status Banner */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="card-icon-box accent-box" style={{ width: '38px', height: '38px' }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Local Model Engine Status</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Loopback isolated. Zero outbound network requests during inference.
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: '8px 0' }} />

        {/* Model Dropdown */}
        <div>
          <div className="sidebar-section-title" style={{ margin: '0 0 8px 0' }}>
            Configured Models
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <CustomDropdown
              options={modelOptions}
              value={selectedModel}
              onChange={setSelectedModel}
              placeholder="Choose a local model..."
              width="360px"
            />
          </div>
        </div>
      </div>

      {/* No Provider Warning Card */}
      {!selectedModel ? (
        <div
          style={{
            padding: '20px',
            borderRadius: '14px',
            backgroundColor: 'var(--surface-card)',
            border: '1px solid rgba(247, 203, 123, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No local engine currently loaded
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '18px' }}>
              No GGUF models are loaded in memory. To run offline inference, place your .gguf model in the models directory and start llama-server, or start Ollama on 127.0.0.1:11434.
            </p>
          </div>
        </div>
      ) : (
        <div className="settings-section-card">
          <h2 className="settings-h2">Model Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Selected Model:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedModel}</span>

            <span style={{ color: 'var(--text-tertiary)' }}>Local Daemon:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              http://127.0.0.1:8080 (Standby)
            </span>

            <span style={{ color: 'var(--text-tertiary)' }}>Hardware Acceleration:</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              DirectML / Direct3D 12 (Available on Windows)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};