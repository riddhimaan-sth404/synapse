import React from 'react';
import { Minus, Square, X, PanelRight, Code2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ActiveSection } from '../types';

interface TitleBarProps {
  activeSection: ActiveSection;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeSection,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'graph':
        return 'Execution Graph';
      case 'orchestral':
        return 'Workflows & Citadel';
      case 'integrations':
        return 'Connected apps';
      case 'local-ai':
        return 'Local AI';
      case 'settings':
        return 'Settings';
      default:
        return 'AI Assistant';
    }
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke('minimize_window');
    } catch {
      try {
        const win = getCurrentWindow();
        await win.minimize();
      } catch (err) {
        console.error('[TitleBar] Minimize error:', err);
      }
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke('maximize_window');
    } catch {
      try {
        const win = getCurrentWindow();
        await win.toggleMaximize();
      } catch (err) {
        console.error('[TitleBar] Maximize error:', err);
      }
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke('close_window');
    } catch {
      try {
        const win = getCurrentWindow();
        await win.close();
      } catch (err) {
        console.error('[TitleBar] Close error:', err);
      }
    }
  };

  return (
    <header className="titlebar">
      {/* Left: Brand Badge & Menus */}
      <div className="titlebar-left">
        <div className="brand-badge">S</div>
        <button className="menu-item-btn">Synapse</button>
        <button className="menu-item-btn">Workspace</button>
        <button className="menu-item-btn">View</button>
        <button className="menu-item-btn">Window</button>
      </div>

      {/* Center: Draggable Area with Breadcrumb Pill */}
      <div className="titlebar-center titlebar-drag-area" data-tauri-drag-region>
        <div className="breadcrumb-pill">
          <span className="breadcrumb-part">synapse</span>
          <span className="breadcrumb-part">/</span>
          <span className="breadcrumb-active">{getSectionTitle()}</span>
        </div>
      </div>

      {/* Right: Status badge, IDE button, Inspector toggle & Window captions */}
      <div className="titlebar-right">
        <div className="status-chip" title="Synapse Core Backend Loopback">
          <span className="dot-indicator" />
          <span>127.0.0.1:3001</span>
        </div>

        <button
          className="titlebar-action-btn"
          title="Open in IDE (VS Code)"
          onClick={() => console.log('Open in IDE')}
        >
          <Code2 size={13} />
          <span>Open IDE</span>
        </button>

        <button
          className={`titlebar-action-btn ${isInspectorOpen ? 'active' : ''}`}
          title="Toggle Inspector Dock"
          onClick={onToggleInspector}
        >
          <PanelRight size={13} />
        </button>

        {/* Windows Flush Caption Controls */}
        <button
          className="caption-btn"
          onClick={handleMinimize}
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          className="caption-btn"
          onClick={handleMaximize}
          title="Maximize"
        >
          <Square size={11} />
        </button>
        <button
          className="caption-btn close"
          onClick={handleClose}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
