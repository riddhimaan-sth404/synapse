export type ActiveSection = 'agent' | 'graph' | 'orchestral' | 'integrations' | 'local-ai' | 'settings';

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'system' | 'success' | 'error' | 'user' | 'agent' | 'subagent';
  subagent?: string;
  diff?: {
    files: number;
    additions: number;
    deletions: number;
  };
}

export interface SubagentItem {
  name: string;
  runtime: string;
  status: 'ready' | 'running' | 'idle';
  icon: string;
}

export interface BackgroundTaskItem {
  name: string;
  details: string;
  status: 'active' | 'standby';
}

export interface ArtifactItem {
  title: string;
  version: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  selected: boolean;
}
