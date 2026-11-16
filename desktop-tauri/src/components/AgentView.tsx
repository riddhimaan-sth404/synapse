import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  Globe,
  Code,
  FileText,
  Shield,
  ArrowUp,
  Cpu,
  ChevronDown,
  ChevronRight,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import { LogEntry } from '../types';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

interface AgentViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onSendMessage: (text: string, model: string) => void;
  isExecuting: boolean;
}

export const AgentView: React.FC<AgentViewProps> = ({
  logs,
  onClearLogs,
  onSendMessage,
  isExecuting,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('local-qwen');
  const [expandedThinking, setExpandedThinking] = useState<{ [key: string]: boolean }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const modelOptions: DropdownOption[] = [
    {
      value: 'local-qwen',
      label: 'Qwen 2.5 Coder 7B',
      subtext: 'DirectML / GGUF (Port 8080)',
      badge: 'Offline (Not loaded)',
      badgeType: 'warning',
      icon: <Cpu size={13} />,
    },
    {
      value: 'local-smollm',
      label: 'SmolLM2 135M',
      subtext: 'CPU GGUF (Port 11434)',
      badge: 'Offline (Not loaded)',
      badgeType: 'warning',
      icon: <Cpu size={13} />,
    },
    {
      value: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      subtext: 'Google Generative Language API',
      badge: 'Not configured',
      badgeType: 'warning',
      icon: <Sparkles size={13} />,
    },
    {
      value: 'groq-llama-70b',
      label: 'Groq Llama 3.3 70B',
      subtext: 'Groq Cloud LPUs',
      badge: 'Not configured',
      badgeType: 'warning',
      icon: <Zap size={13} />,
    },
    {
      value: 'cerebras-llama-8b',
      label: 'Cerebras Llama 3.1 8B',
      subtext: 'Cerebras WSE Cloud',
      badge: 'Not configured',
      badgeType: 'warning',
      icon: <Zap size={13} />,
    },
    {
      value: 'deepseek-v3',
      label: 'DeepSeek V3',
      subtext: 'SiliconFlow / DeepSeek API',
      badge: 'Not configured',
      badgeType: 'warning',
      icon: <Sparkles size={13} />,
    },
  ];

  // Filter conversation to only actual user and agent messages (no raw system telemetry)
  const conversationMessages = logs.filter(
    (log) => log.type === 'user' || log.type === 'agent'
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversationMessages, isExecuting]);

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isExecuting) return;
    onSendMessage(prompt.trim(), selectedModel);
    setPrompt('');
  };

  const handleInsertTag = (tag: string) => {
    setPrompt((prev) => (prev ? `${prev.trim()} ${tag} ` : `${tag} `));
  };

  return (
    <div className="agent-view-container">
      {/* View Header */}
      <div className="agent-view-header">
        <div>
          <h1 className="header-title">AI Assistant</h1>
          <p className="header-subtitle">
            Local-first deterministic inference with multi-agent orchestration.
          </p>
        </div>

        <div className="header-actions">
          <div className="status-chip success">
            <span className="dot-indicator" />
            <span>Local engine ready</span>
          </div>

          {conversationMessages.length > 0 && (
            <button
              className="ui-btn-secondary"
              onClick={onClearLogs}
              title="Clear conversation"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="chat-canvas">
        <div className="chat-log-scroll" ref={scrollRef}>
          {conversationMessages.length === 0 ? (
            <div className="chat-empty-hero">
              <div className="hero-brand-symbol">S</div>
              <h2 className="hero-title">How can Synapse assist you today?</h2>
              <p className="hero-desc">
                Execute local reasoning, dispatch autonomous subagents, or verify actions through the Citadel audit ledger.
              </p>

              <div className="starter-prompts-grid">
                <button
                  className="starter-prompt-card"
                  onClick={() =>
                    handleInsertTag('Analyze current codebase structure and check Citadel audit policies')
                  }
                >
                  <span className="starter-prompt-tag">Security &amp; Audit</span>
                  <span className="starter-prompt-text">
                    Analyze current codebase structure and check Citadel audit policies
                  </span>
                </button>

                <button
                  className="starter-prompt-card"
                  onClick={() =>
                    handleInsertTag('@browser inspect latest web UI updates and capture status')
                  }
                >
                  <span className="starter-prompt-tag">Autonomous Web</span>
                  <span className="starter-prompt-text">
                    @browser inspect latest web UI updates and capture status
                  </span>
                </button>

                <button
                  className="starter-prompt-card"
                  onClick={() =>
                    handleInsertTag('@coding run JCode specialist with AST analysis on project workspace')
                  }
                >
                  <span className="starter-prompt-tag">Coding Specialist</span>
                  <span className="starter-prompt-text">
                    @coding run JCode specialist with AST analysis on project workspace
                  </span>
                </button>
              </div>
            </div>
          ) : (
            conversationMessages.map((log, index) => (
              <div
                key={log.id}
                className={`message-card animate-message-entrance ${log.type === 'user' ? 'user-message' : 'agent-message'}`}
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
              >
                {/* Header identity */}
                <div className="message-header-row">
                  <div className="message-avatar">
                    {log.type === 'user' ? (
                      <User size={13} color="#FFFFFF" />
                    ) : (
                      <Bot size={13} color="var(--accent)" />
                    )}
                  </div>
                  <span className="message-sender-name">
                    {log.type === 'user' ? 'You' : 'Synapse Specialist'}
                  </span>
                  <span className="message-timestamp">{log.timestamp}</span>
                </div>

                {/* Collapsible Reasoning Trace (Agent only) */}
                {log.type === 'agent' && (
                  <div className="thought-bubble-wrapper">
                    <button
                      className={`thought-pill-btn ${expandedThinking[log.id] ? 'expanded' : ''}`}
                      onClick={() => toggleThinking(log.id)}
                    >
                      <Sparkles size={11} className="thought-sparkle" />
                      <span>Thought for 2s (reasoning trace)</span>
                      {expandedThinking[log.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </button>

                    {expandedThinking[log.id] && (
                      <div className="thought-trace-body animate-fade-in">
                        <div className="thought-step">
                          <span className="thought-bullet">&gt;</span>
                          <span>Evaluated route: {selectedModel}.</span>
                        </div>
                        <div className="thought-step">
                          <span className="thought-bullet">&gt;</span>
                          <span>Citadel cryptographic ledger proof validated.</span>
                        </div>
                        <div className="thought-step">
                          <span className="thought-bullet">&gt;</span>
                          <span>Workspace sandbox perimeter confirmed intact.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <div className="message-body-content">
                  <p className="message-text">{log.text}</p>

                  {/* Subagent Card */}
                  {log.subagent && (
                    <div className="subagent-callout-card animate-slide-up">
                      <div className="subagent-card-header">
                        <Globe size={13} className="subagent-icon" />
                        <span className="subagent-name">{log.subagent}</span>
                        <span className="subagent-badge">Worker Active</span>
                      </div>
                      <p className="subagent-desc">
                        Autonomous worker execution verified within relative workspace confines.
                      </p>
                    </div>
                  )}

                  {/* Diff Summary */}
                  {log.diff && (
                    <div className="diff-review-card animate-slide-up">
                      <div className="diff-meta">
                        <span>{log.diff.files} file modified</span>
                        <span className="diff-stat-add">+{log.diff.additions}</span>
                        <span className="diff-stat-del">-{log.diff.deletions}</span>
                      </div>
                      <button className="diff-review-btn">Review Changes</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Active Generation Shimmer */}
          {isExecuting && (
            <div className="message-card agent-message active-generating animate-pulse-glow">
              <div className="message-header-row">
                <div className="message-avatar generating">
                  <Bot size={13} color="var(--accent)" />
                </div>
                <span className="message-sender-name">Synapse Specialist</span>
                <span className="message-timestamp">Active</span>
              </div>
              <div className="generating-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
                <span className="generating-label">Reasoning and executing action...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sleek Composer Container */}
      <div className="composer-container">
        {/* Subtle Quick Actions Micro-bar */}
        <div className="composer-actions-micro-bar">
          <button
            className="micro-chip-btn"
            onClick={() => handleInsertTag('@browser')}
            title="Stagehand Go browser worker"
          >
            <Globe size={11} />
            <span>@browser</span>
          </button>

          <button
            className="micro-chip-btn"
            onClick={() => handleInsertTag('@coding')}
            title="JCode specialist coding harness"
          >
            <Code size={11} />
            <span>@coding</span>
          </button>

          <button
            className="micro-chip-btn"
            onClick={() => handleInsertTag('@docling')}
            title="Docling document parser"
          >
            <FileText size={11} />
            <span>@docling</span>
          </button>

          <button
            className="micro-chip-btn"
            onClick={() => handleInsertTag('/audit')}
            title="Citadel cryptographic audit ledger"
          >
            <Shield size={11} />
            <span>/audit</span>
          </button>

          <button
            className="micro-chip-btn"
            onClick={() => handleInsertTag('/approve')}
            title="Review pending human authorization gates"
          >
            <Zap size={11} />
            <span>/approve</span>
          </button>
        </div>

        {/* Antigravity Signature Iridescent Composer Card */}
        <div className={`composer-card ${isExecuting ? 'executing-glow' : ''}`}>
          <div className="composer-upper">
            <textarea
              className="composer-textarea"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, @ for agents, / for commands..."
              disabled={isExecuting}
            />
          </div>

          <div className="composer-lower">
            {/* Left Controls: Gorgeous Model Swapping Dropdown */}
            <div className="composer-controls-left">
              <CustomDropdown
                options={modelOptions}
                value={selectedModel}
                onChange={setSelectedModel}
                className="composer-dropdown"
              />
            </div>

            {/* Right Controls: Circular Action Button */}
            <div className="composer-controls-right">
              <span className="composer-keyhint">Enter to send</span>
              <button
                className={`composer-send-circle ${prompt.trim() && !isExecuting ? 'active' : ''}`}
                onClick={handleSubmit}
                disabled={!prompt.trim() || isExecuting}
                title="Send Message"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};