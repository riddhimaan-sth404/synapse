import React from 'react';
import { Plus, Sparkles, Activity, Shield, LayoutGrid, Zap, SlidersHorizontal } from 'lucide-react';
import { ActiveSection } from '../types';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onNewConversation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onNewConversation,
}) => {
  return (
    <aside className="sidebar">
      {/* Primary Action Button */}
      <button className="new-conv-btn" onClick={onNewConversation}>
        <Plus size={15} />
        <span>New conversation</span>
      </button>

      {/* Navigation Section */}
      <div className="sidebar-section-title">Workspace</div>

      <button
        className={`nav-item-btn ${activeSection === 'agent' ? 'active' : ''}`}
        onClick={() => onSelectSection('agent')}
      >
        <Sparkles size={15} />
        <span>AI Assistant</span>
      </button>

      <button
        className={`nav-item-btn ${activeSection === 'graph' ? 'active' : ''}`}
        onClick={() => onSelectSection('graph')}
      >
        <Activity size={15} />
        <span>Execution Graph</span>
      </button>

      <button
        className={`nav-item-btn ${activeSection === 'orchestral' ? 'active' : ''}`}
        onClick={() => onSelectSection('orchestral')}
      >
        <Shield size={15} />
        <span>Workflows &amp; Citadel</span>
      </button>

      <button
        className={`nav-item-btn ${activeSection === 'integrations' ? 'active' : ''}`}
        onClick={() => onSelectSection('integrations')}
      >
        <LayoutGrid size={15} />
        <span>Connected apps</span>
      </button>

      <button
        className={`nav-item-btn ${activeSection === 'local-ai' ? 'active' : ''}`}
        onClick={() => onSelectSection('local-ai')}
      >
        <Zap size={15} />
        <span>Local AI</span>
      </button>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={`nav-item-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectSection('settings')}
        >
          <SlidersHorizontal size={15} />
          <span>Settings</span>
        </button>

        <div className="footer-badge">
          <span className="dot-indicator" />
          <span>Local engine ready</span>
        </div>
      </div>
    </aside>
  );
};
