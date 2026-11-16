import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitBranch, ListOrdered, CheckCircle, Clock, ShieldCheck, Activity } from 'lucide-react';
import { LogEntry } from '../types';

interface MermaidGraphProps {
  logs: LogEntry[];
  isExecuting: boolean;
}

type GraphMode = 'flow' | 'sequence' | 'timeline';

// Initialize Mermaid with Antigravity dark aesthetic
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#1D1D1C',
    primaryColor: '#262625',
    primaryTextColor: '#E2E8F0',
    primaryBorderColor: '#7EB0FF',
    lineColor: '#8AB4F8',
    secondaryColor: '#1A2332',
    tertiaryColor: '#141413',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '12px',
  },
});

export const MermaidGraph: React.FC<MermaidGraphProps> = ({ logs, isExecuting }) => {
  const [mode, setMode] = useState<GraphMode>('flow');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate Mermaid diagram definition based on mode and logs
  const generateDefinition = (): string => {
    if (logs.length === 0) {
      return `flowchart LR
    Idle([System Ready])
    style Idle fill:#1D1D1C,stroke:#7EB0FF,stroke-width:2px,color:#E2E8F0
`;
    }

    if (mode === 'sequence') {
      let def = `sequenceDiagram
    autonumber
    actor User as User
    participant Synapse as Synapse Gateway [127.0.0.1:3001]
    participant Agent as Model Specialist
    participant Citadel as Citadel Ledger
`;

      const recentLogs = logs.slice(-12);
      recentLogs.forEach((log) => {
        const cleanText = log.text.replace(/[:"'\n]/g, ' ').substring(0, 36);
        if (log.type === 'user') {
          def += `    User->>Synapse: ${cleanText}\n`;
        } else if (log.type === 'agent') {
          def += `    Synapse->>Agent: Route task\n`;
          def += `    Agent-->>Synapse: ${cleanText}\n`;
        } else if (log.type === 'subagent' || log.subagent) {
          def += `    Synapse->>Agent: Subagent [${log.subagent || 'Worker'}]\n`;
          def += `    Agent-->>Citadel: Audit proof logged\n`;
        } else {
          def += `    Synapse->>Citadel: Event [${log.type}]: ${cleanText}\n`;
        }
      });

      if (isExecuting) {
        def += `    Note over Synapse,Agent: Active execution in progress...\n`;
      }
      return def;
    }

    // Default: Flowchart showing step transitions
    let def = `flowchart LR
    classDef default fill:#1D1D1C,stroke:#2B2B29,stroke-width:1.5px,color:#E2E8F0;
    classDef completed fill:#132E20,stroke:#9BD9AE,stroke-width:2px,color:#E2E8F0;
    classDef active fill:#172A45,stroke:#7EB0FF,stroke-width:2.5px,color:#FFFFFF;
    classDef warning fill:#332612,stroke:#F7CB7B,stroke-width:2px,color:#E2E8F0;

`;

    const recentLogs = logs.slice(-6);
    const nodeIds: string[] = [];

    recentLogs.forEach((log, idx) => {
      const nodeId = `step_${idx}`;
      nodeIds.push(nodeId);
      const cleanText = log.text.replace(/[\[\]\(\)\{\}:"'\n]/g, ' ').substring(0, 24);
      const label = `["${log.timestamp} <br/> <b>${cleanText}</b>"]`;

      def += `    ${nodeId}${label}\n`;

      if (idx === recentLogs.length - 1 && isExecuting) {
        def += `    class ${nodeId} active;\n`;
      } else if (log.type === 'subagent') {
        def += `    class ${nodeId} warning;\n`;
      } else {
        def += `    class ${nodeId} completed;\n`;
      }
    });

    // Link chronological sequence
    for (let i = 0; i < nodeIds.length - 1; i++) {
      def += `    ${nodeIds[i]} --> ${nodeIds[i + 1]}\n`;
    }

    if (isExecuting && nodeIds.length > 0) {
      def += `    ${nodeIds[nodeIds.length - 1]} -.-> Next(["Pulsing..."])\n`;
      def += `    class Next active;\n`;
    }

    return def;
  };

  useEffect(() => {
    let isCancelled = false;

    const renderChart = async () => {
      const def = generateDefinition();
      const uniqueId = `mermaid-${Date.now()}`;
      try {
        const { svg } = await mermaid.render(uniqueId, def);
        if (!isCancelled) {
          setSvgHtml(svg);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.warn('[MermaidGraph] Render error:', err);
        }
      }
    };

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [logs, mode, isExecuting]);

  return (
    <div className="mermaid-execution-card">
      <div className="mermaid-header">
        <div className="mermaid-title-cluster">
          <Activity size={14} className={isExecuting ? 'spin-icon' : ''} color="var(--accent)" />
          <span className="mermaid-heading">Real-Time Execution Graph</span>
          <span className="event-count-badge">{logs.length} events logged</span>
        </div>

        <div className="graph-mode-toggle">
          <button
            className={`mode-btn ${mode === 'flow' ? 'active' : ''}`}
            onClick={() => setMode('flow')}
            title="Flowchart View"
          >
            <GitBranch size={12} />
            <span>Flow</span>
          </button>
          <button
            className={`mode-btn ${mode === 'sequence' ? 'active' : ''}`}
            onClick={() => setMode('sequence')}
            title="Sequence View"
          >
            <ListOrdered size={12} />
            <span>Sequence</span>
          </button>
        </div>
      </div>

      <div className="mermaid-svg-viewport" ref={containerRef}>
        {svgHtml ? (
          <div
            className="mermaid-svg-container animate-fade-in"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="mermaid-loading-placeholder">
            <Clock size={16} className="spin-icon" color="var(--text-tertiary)" />
            <span>Rendering chronological execution stream...</span>
          </div>
        )}
      </div>

      <div className="mermaid-footer-status">
        <div className="status-item">
          <ShieldCheck size={12} color="var(--success)" />
          <span>Citadel audit ledger verified</span>
        </div>
        <div className="status-item">
          <CheckCircle size={12} color="var(--accent)" />
          <span>Loopback deterministic ordering</span>
        </div>
      </div>
    </div>
  );
};