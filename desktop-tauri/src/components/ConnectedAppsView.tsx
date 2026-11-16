import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { IntegrationItem } from '../types';

export const ConnectedAppsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: 'google_workspace',
      name: 'Google Workspace',
      category: 'Productivity',
      description: 'Shared Google token used across Docs, Sheets, Drive, Gmail, Calendar, and Slides.',
      connected: true,
      selected: true,
    },
    {
      id: 'google_docs',
      name: 'Google Docs',
      category: 'Workspace',
      description: 'Read and create Google Documents directly from agent output.',
      connected: true,
      selected: true,
    },
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      category: 'Workspace',
      description: 'Read and append rows into Google Spreadsheets.',
      connected: true,
      selected: false,
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Messaging',
      description: 'Send notifications and agent reports into your Slack team channels.',
      connected: false,
      selected: false,
    },
    {
      id: 'discord',
      name: 'Discord',
      category: 'Messaging',
      description: 'Post updates and logs directly to Discord webhook channels.',
      connected: true,
      selected: false,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      category: 'Messaging',
      description: 'Direct message dispatch via official Telegram bot token.',
      connected: false,
      selected: false,
    },
  ]);

  const toggleDispatch = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const filtered = integrations.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1080px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '23px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Connected apps
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Zero-key browser authentication. Dispatches agent deliverables directly to your apps.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="standard-input"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px', paddingLeft: '28px' }}
          />
          <Search
            size={13}
            color="var(--text-tertiary)"
            style={{ position: 'absolute', left: '10px', top: '10px' }}
          />
        </div>
      </div>

      {/* Grid of Apps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--stroke)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {item.category}
                </div>
              </div>

              {item.connected ? (
                <span className="inspector-badge-ok">Connected</span>
              ) : (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-tertiary)',
                    backgroundColor: 'var(--surface-inset)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Not connected
                </span>
              )}
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', minHeight: '34px', lineHeight: '17px' }}>
              {item.description}
            </p>

            <div className="divider" style={{ margin: '0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleDispatch(item.id)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>Include in dispatch</span>
              </label>

              <button
                className="ui-btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                }}
              >
                <span>Setup</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
