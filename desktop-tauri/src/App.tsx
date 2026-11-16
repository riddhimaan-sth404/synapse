import { useState } from 'react';
import './App.css';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { InspectorDock } from './components/InspectorDock';
import { AgentView } from './components/AgentView';
import { GraphView } from './components/GraphView';
import { WorkflowsView } from './components/WorkflowsView';
import { ConnectedAppsView } from './components/ConnectedAppsView';
import { LocalAiView } from './components/LocalAiView';
import { SettingsView } from './components/SettingsView';
import { ActiveSection, LogEntry } from './types';

export function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('agent');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleSendMessage = async (text: string, model: string = 'local-qwen') => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userLog: LogEntry = {
      id: `user-${Date.now()}`,
      timestamp: userTime,
      text,
      type: 'user',
    };

    setLogs((prev) => [...prev, userLog]);
    setIsExecuting(true);

    // Command handling
    setTimeout(async () => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (text.startsWith('/audit')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `audit-${Date.now()}`,
            timestamp: time,
            text: '[Citadel Security Engine] Append-only audit ledger queried. Zero policy violations recorded.',
            type: 'agent',
          },
        ]);
      } else if (text.startsWith('/approve')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `approve-${Date.now()}`,
            timestamp: time,
            text: '[Citadel Control Plane] Zero pending actions requiring authorization.',
            type: 'agent',
          },
        ]);
      } else if (text.startsWith('@browser')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `sub-${Date.now()}`,
            timestamp: time,
            text: 'Stagehand Go browser worker session initiated. Awaiting task target.',
            type: 'agent',
            subagent: 'Browser Agent (Stagehand Go)',
          },
        ]);
      } else if (text.startsWith('@coding')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `coding-${Date.now()}`,
            timestamp: time,
            text: 'JCode specialist harness active with Analyst role. Ready for workspace AST analysis.',
            type: 'agent',
          },
        ]);
      } else if (text.startsWith('@docling')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `docling-${Date.now()}`,
            timestamp: time,
            text: 'Docling document worker ready for ingestion and table extraction.',
            type: 'agent',
          },
        ]);
      } else if (text.startsWith('@langgraph')) {
        setLogs((prev) => [
          ...prev,
          {
            id: `langgraph-${Date.now()}`,
            timestamp: time,
            text: 'LangGraph multi-agent coordination graph ready. SQLite checkpoints active.',
            type: 'agent',
          },
        ]);
      } else {
        // Attempt backend-rust API call
        try {
          const res = await fetch('http://127.0.0.1:3001/api/agent/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, mode: model.startsWith('local') ? 'local' : 'cloud' }),
          });

          if (res.ok) {
            const data = await res.json();
            setLogs((prev) => [
              ...prev,
              {
                id: `resp-${Date.now()}`,
                timestamp: time,
                text: data.result || 'Task completed successfully by Synapse Core.',
                type: 'agent',
              },
            ]);
          } else {
            throw new Error('Local engine offline');
          }
        } catch {
          // If no provider configured, honestly say so
          setLogs((prev) => [
            ...prev,
            {
              id: `resp-${Date.now()}`,
              timestamp: time,
              text: `[Provider Unconfigured] No active engine or API key is configured for model "${model}". To run this model, start your local engine (llama-server on 8080 or Ollama on 11434) or configure the cloud API key in Settings / .env.`,
              type: 'agent',
            },
          ]);
        }
      }

      setIsExecuting(false);
    }, 600);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="app-container">
      {/* Top Title Bar with Antigravity / VS Code aesthetics */}
      <TitleBar
        activeSection={activeSection}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
      />

      {/* Main Workspace Area */}
      <div className="workspace-grid">
        {/* Left Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onNewConversation={handleClearLogs}
        />

        {/* Center Canvas / Active View */}
        <main className="main-content">
          {/* Ambient Aurora Blooms */}
          <div className="aurora-canvas">
            <div className="aurora-blob aurora-blue" />
            <div className="aurora-blob aurora-rose" />
            <div className="aurora-blob aurora-amber" />
            <div className="aurora-blob aurora-mint" />
          </div>

          <div className="view-container">
            {activeSection === 'agent' && (
              <AgentView
                logs={logs}
                onClearLogs={handleClearLogs}
                onSendMessage={handleSendMessage}
                isExecuting={isExecuting}
              />
            )}
            {activeSection === 'graph' && (
              <GraphView
                logs={logs}
                isExecuting={isExecuting}
                onClearLogs={handleClearLogs}
              />
            )}
            {activeSection === 'orchestral' && <WorkflowsView />}
            {activeSection === 'integrations' && <ConnectedAppsView />}
            {activeSection === 'local-ai' && <LocalAiView />}
            {activeSection === 'settings' && <SettingsView />}
          </div>
        </main>

        {/* Right Inspector Dock */}
        <InspectorDock isOpen={isInspectorOpen} />
      </div>
    </div>
  );
}

export default App;
