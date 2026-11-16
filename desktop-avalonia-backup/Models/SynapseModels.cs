using System;
using System.Collections.Generic;

namespace Synapse.Desktop.Models;

public class WorkerItem
{
    public string Name { get; set; } = string.Empty;
    public string RuntimeType { get; set; } = string.Empty;
    public string EndpointUrl { get; set; } = string.Empty;
    public string State { get; set; } = "Stopped";
    public int? Pid { get; set; }
    public int Port { get; set; }
    public ulong IdleSeconds { get; set; }
    public uint CrashCount { get; set; }
}

public class ToolItem
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool RequiresApproval { get; set; }
    public bool IsEnabled { get; set; } = true;
    public string? EndpointUrl { get; set; }
}

public class MemoryItem
{
    public string Id { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string MemoryType { get; set; } = "semantic";
    public string Category { get; set; } = "general";
    public string Content { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class ModelUsageItem
{
    public ulong TotalRequests { get; set; }
    public ulong TotalPromptTokens { get; set; }
    public ulong TotalCompletionTokens { get; set; }
    public string ActiveProvider { get; set; } = string.Empty;
}
