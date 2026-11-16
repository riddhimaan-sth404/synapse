using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Synapse.Desktop.Models;

namespace Synapse.Desktop.Services;

public interface IAgentClientService
{
    string BackendUrl { get; set; }
    Task<(bool Ok, string? Error)> VerifyLicenseAsync(string licenseKey, string machineId, CancellationToken ct = default);
    Task<(bool Ok, string? Result, string? Error)> RunLocalAsync(string prompt, WorkflowType workflow, TaskComplexity complexity, CancellationToken ct = default);
    Task<(bool Ok, string? Result, string? Error)> RunStandardAsync(string prompt, string licenseKey, string machineId, WorkflowType workflow, TaskComplexity complexity, List<string>? targetIntegrations = null, CancellationToken ct = default);
    Task<(bool Ok, string? Result, string? Error)> RunByokAsync(string prompt, string byokKey, WorkflowType workflow, TaskComplexity complexity, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DispatchDirectIntegrationAsync(IntegrationItem integration, string result, string prompt, WorkflowType workflow, TaskComplexity complexity, CancellationToken ct = default);
    Task<bool> DispatchIntegrationsAsync(string result, string? prompt, string? licenseKey, string? machineId, WorkflowType workflow, TaskComplexity complexity, List<string> targetIntegrations, CancellationToken ct = default);
    Task<List<IntegrationItem>> GetIntegrationStatusesAsync(string machineId, CancellationToken ct = default);
    Task<JsonObject?> GetOrchestralStatusAsync(CancellationToken ct = default);
    Task<List<OrchestralApproval>> GetPendingApprovalsAsync(CancellationToken ct = default);
    Task<List<OrchestralAgent>> GetOrchestralAgentsAsync(CancellationToken ct = default);
    Task<List<OrchestralFinding>> GetOrchestralFindingsAsync(CancellationToken ct = default);
    Task<List<OrchestralAuditEntry>> GetOrchestralAuditAsync(CancellationToken ct = default);
    Task<(bool Ok, string? Error)> ResolveOrchestralApprovalAsync(string id, bool approve, CancellationToken ct = default);
    Task<(bool Ok, string? JobId, string? Error)> StartLocalAnalysisAsync(string workspace, CancellationToken ct = default);
    Task<JsonObject?> GetLocalAnalysisJobAsync(string jobId, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> CancelLocalAnalysisAsync(string jobId, CancellationToken ct = default);
    Task<JsonObject?> GetJcodeStatusAsync(CancellationToken ct = default);
    Task<(bool Ok, string? Error)> ConfigureJcodeProviderAsync(string provider, string apiKey, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> ClearJcodeProviderAsync(string provider, CancellationToken ct = default);
    Task<List<string>> GetJcodeSessionsAsync(CancellationToken ct = default);
    Task<(bool Ok, string? SessionId, string? Error)> CreateJcodeSessionAsync(string workspace, string role, string objective, CancellationToken ct = default);
    Task<List<JsonObject>> GetJcodeEventsAsync(long afterSequence, CancellationToken ct = default);
    Task<(bool Ok, string? Result, string? Error)> RunJcodeSessionAsync(string sessionId, string prompt, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> CancelJcodeSessionAsync(string sessionId, CancellationToken ct = default);
    Task<(bool Ok, JsonObject? Batch, string? Error)> StartJcodeBatchAsync(string workspace, string role, List<string> tasks, CancellationToken ct = default);
    Task<JsonObject?> GetJcodeBatchAsync(string batchId, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> CancelJcodeBatchAsync(string batchId, CancellationToken ct = default);
    Task<List<WorkerItem>> GetRuntimeStatusAsync(CancellationToken ct = default);
    Task<JsonObject?> ReapIdleWorkersAsync(CancellationToken ct = default);
    Task<List<ToolItem>> ListToolsAsync(CancellationToken ct = default);
    Task<List<MemoryItem>> GetMemoryRecordsAsync(string? query = null, CancellationToken ct = default);
    Task<(bool Ok, MemoryItem? Item, string? Error)> AddMemoryRecordAsync(string content, string category, string memoryType, CancellationToken ct = default);
    Task<bool> DeleteMemoryRecordAsync(string id, CancellationToken ct = default);
    Task<ModelUsageItem?> GetModelUsageAsync(CancellationToken ct = default);
}

public class AgentClientService : IAgentClientService
{
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromMinutes(10) };
    private readonly ISecureStorageService _storage;

    public string BackendUrl { get; set; } = "http://localhost:3001";

    public AgentClientService(ISecureStorageService storage)
    {
        _storage = storage;
        var savedUrl = _storage.GetSecret("backend_url");
        if (!string.IsNullOrWhiteSpace(savedUrl))
            BackendUrl = savedUrl;
    }

    private string? _localApiToken;

    /// <summary>
    /// Resolves the local backend API token required by the orchestral/JCode
    /// routes. The backend generates a token on first run and persists it
    /// owner-only at .synapse/backend-token; SYNAPSE_API_TOKEN overrides
    /// the file. The token is attached per request so it is never leaked to
    /// non-backend hosts via default headers.
    /// </summary>
    private string? GetLocalApiToken()
    {
        if (!string.IsNullOrWhiteSpace(_localApiToken))
            return _localApiToken;

        var env = Environment.GetEnvironmentVariable("SYNAPSE_API_TOKEN")
            ?? Environment.GetEnvironmentVariable("MUTEXFLOW_API_TOKEN");
        if (!string.IsNullOrWhiteSpace(env))
        {
            _localApiToken = env.Trim();
            return _localApiToken;
        }

        // Prefer explicit paths used by packaged installs, then search the
        // launch/application directories for development deployments.
        var candidates = new List<string>();
        var configuredFile = Environment.GetEnvironmentVariable("SYNAPSE_API_TOKEN_FILE")
            ?? Environment.GetEnvironmentVariable("MUTEXFLOW_API_TOKEN_FILE");
        if (!string.IsNullOrWhiteSpace(configuredFile))
            candidates.Add(configuredFile);
        var configuredRoot = Environment.GetEnvironmentVariable("SYNAPSE_ROOT")
            ?? Environment.GetEnvironmentVariable("MUTEXFLOW_ROOT");
        if (!string.IsNullOrWhiteSpace(configuredRoot))
        {
            candidates.Add(Path.Combine(configuredRoot, ".synapse", "backend-token"));
            candidates.Add(Path.Combine(configuredRoot, ".mutexflow", "backend-token"));
        }

        foreach (var initial in new[] { Environment.CurrentDirectory, AppContext.BaseDirectory })
        {
            if (string.IsNullOrWhiteSpace(initial)) continue;
            DirectoryInfo? current = new DirectoryInfo(initial);
            for (var depth = 0; current != null && depth < 8; depth++, current = current.Parent)
            {
                candidates.Add(Path.Combine(current.FullName, ".synapse", "backend-token"));
                candidates.Add(Path.Combine(current.FullName, ".mutexflow", "backend-token"));
            }
        }

        foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                if (!File.Exists(candidate)) continue;
                var value = File.ReadAllText(candidate).Trim();
                if (value.Length < 16) continue;
                _localApiToken = value;
                _storage.SaveSecret("backend_api_token", value);
                return _localApiToken;
            }
            catch
            {
                // Try other configured locations; the backend rejects
                // unauthenticated requests rather than bypassing its guard.
            }
        }

        var saved = _storage.GetSecret("backend_api_token");
        if (!string.IsNullOrWhiteSpace(saved) && saved.Trim().Length >= 16)
            _localApiToken = saved.Trim();

        return _localApiToken;
    }

    private Task<HttpResponseMessage> GetWithLocalTokenAsync(string url, CancellationToken ct)
        => SendWithLocalTokenAsync(new HttpRequestMessage(HttpMethod.Get, url), ct);

    private Task<HttpResponseMessage> PostWithLocalTokenAsync(string url, HttpContent? content, CancellationToken ct)
        => SendWithLocalTokenAsync(new HttpRequestMessage(HttpMethod.Post, url) { Content = content }, ct);

    private async Task<HttpResponseMessage> SendWithLocalTokenAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var token = GetLocalApiToken();
        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Add("X-Synapse-Token", token);
            request.Headers.Add("X-MutexFlow-Token", token);
        }
        try
        {
            return await _http.SendAsync(request, ct);
        }
        finally
        {
            request.Dispose();
        }
    }

    public async Task<(bool Ok, string? Error)> VerifyLicenseAsync(string licenseKey, string machineId, CancellationToken ct = default)
    {
        try
        {
            var payload = new { licenseKey, machineId };
            var resp = await _http.PostAsJsonAsync($"{BackendUrl}/api/v1/auth/verify-license", payload, ct);
            var json = await resp.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);

            if (json != null && json["ok"]?.GetValue<bool>() == true)
                return (true, null);

            var err = json?["error"]?.GetValue<string>() ?? $"HTTP {resp.StatusCode}";
            return (false, err);
        }
        catch
        {
            // In local-first offline mode, permit license verification if server is unreachable
            return (true, null);
        }
    }

    public async Task<(bool Ok, string? Result, string? Error)> RunLocalAsync(
        string prompt,
        WorkflowType workflow,
        TaskComplexity complexity,
        CancellationToken ct = default)
    {
        try
        {
            var systemPrompt = workflow switch
            {
                WorkflowType.DataExtraction => "You are a data extraction assistant. Extract key entities, dates, and amounts into structured JSON.",
                WorkflowType.ProfessionalDrafting => "You are a professional writing assistant. Draft clear, natural, and thoughtful messages.",
                _ => "You are Synapse, a helpful and precise local AI assistant. Think step by step and provide actionable answers."
            };

            var messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = prompt }
            };

            var payload = new { model = "local-model", messages, temperature = 0.7 };
            var resp = await _http.PostAsJsonAsync("http://localhost:8080/v1/chat/completions", payload, ct);

            if (!resp.IsSuccessStatusCode)
                return (false, null, $"Local engine returned HTTP {resp.StatusCode}");

            var json = await resp.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            var content = json?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(content))
                return (false, null, "Local AI returned an empty response.");

            return (true, content, null);
        }
        catch (Exception ex)
        {
            return (false, null, $"Cannot connect to local AI on http://localhost:8080: {ex.Message}");
        }
    }

    public async Task<(bool Ok, string? Result, string? Error)> RunStandardAsync(
        string prompt,
        string licenseKey,
        string machineId,
        WorkflowType workflow,
        TaskComplexity complexity,
        List<string>? targetIntegrations = null,
        CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                prompt,
                licenseKey,
                machineId,
                workflowType = workflow.ToString().ToLowerInvariant(),
                taskComplexity = complexity.ToString().ToLowerInvariant(),
                targetIntegrations = targetIntegrations ?? new List<string>()
            };

            var resp = await _http.PostAsJsonAsync($"{BackendUrl}/api/v1/agent/process-standard", payload, ct);
            var json = await resp.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);

            if (json != null && json["ok"]?.GetValue<bool>() == true)
            {
                var result = json["result"]?.GetValue<string>() ?? string.Empty;
                return (true, result, null);
            }

            var err = json?["error"]?.GetValue<string>() ?? $"HTTP {resp.StatusCode}";
            return (false, null, err);
        }
        catch (Exception ex)
        {
            return (false, null, $"Cloud agent error: {ex.Message}");
        }
    }

    public async Task<(bool Ok, string? Result, string? Error)> RunByokAsync(
        string prompt,
        string byokKey,
        WorkflowType workflow,
        TaskComplexity complexity,
        CancellationToken ct = default)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", byokKey);

            var messages = new[]
            {
                new { role = "system", content = $"You are Synapse, an enterprise assistant. Workflow: {workflow}." },
                new { role = "user", content = prompt }
            };

            req.Content = JsonContent.Create(new { model = "openai/gpt-4o-mini", messages });

            var resp = await _http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var errBody = await resp.Content.ReadAsStringAsync(ct);
                return (false, null, $"OpenRouter HTTP {resp.StatusCode}: {errBody}");
            }

            var json = await resp.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            var content = json?["choices"]?[0]?["message"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(content))
            {
                content = json?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();
            }

            if (string.IsNullOrWhiteSpace(content))
                return (false, null, "OpenRouter returned empty response.");

            return (true, content, null);
        }
        catch (Exception ex)
        {
            return (false, null, $"OpenRouter error: {ex.Message}");
        }
    }

    public async Task<(bool Ok, string? Error)> DispatchDirectIntegrationAsync(
        IntegrationItem integration,
        string result,
        string prompt,
        WorkflowType workflow,
        TaskComplexity complexity,
        CancellationToken ct = default)
    {
        var token = integration.ApiKeyOrToken.Trim();
        var destination = integration.TargetDestination.Trim();

        try
        {
            if (integration.Id == "slack")
            {
                if (token.StartsWith("https://hooks.slack.com"))
                {
                    var payload = new { text = $"*Synapse Result*\n```{result}```" };
                    var resp = await _http.PostAsJsonAsync(token, payload, ct);
                    return resp.IsSuccessStatusCode ? (true, null) : (false, $"Slack webhook HTTP {resp.StatusCode}");
                }
                else if (token.StartsWith("xoxb-"))
                {
                    using var req = new HttpRequestMessage(HttpMethod.Post, "https://slack.com/api/chat.postMessage");
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    req.Content = JsonContent.Create(new
                    {
                        channel = string.IsNullOrEmpty(destination) ? "#general" : destination,
                        text = $"*Synapse Result*\n```{result}```"
                    });
                    var resp = await _http.SendAsync(req, ct);
                    return resp.IsSuccessStatusCode ? (true, null) : (false, $"Slack API HTTP {resp.StatusCode}");
                }
            }
            else if (integration.Id == "github")
            {
                var repo = string.IsNullOrEmpty(destination) ? "owner/repo" : destination;
                using var req = new HttpRequestMessage(HttpMethod.Post, $"https://api.github.com/repos/{repo}/issues");
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                req.Headers.UserAgent.Add(new ProductInfoHeaderValue("Synapse-Desktop", "1.0"));
                req.Content = JsonContent.Create(new
                {
                    title = $"Synapse Result: {workflow} - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                    body = $"## Agent Output\n\n**Prompt:** {prompt}\n\n### Result\n```\n{result}\n```"
                });
                var resp = await _http.SendAsync(req, ct);
                return resp.IsSuccessStatusCode ? (true, null) : (false, $"GitHub API HTTP {resp.StatusCode}");
            }
            else if (integration.Id == "discord")
            {
                if (token.StartsWith("https://discord.com/api/webhooks/"))
                {
                    var payload = new { content = $"**Synapse Result** [{workflow}]\n```{result}```" };
                    var resp = await _http.PostAsJsonAsync(token, payload, ct);
                    return resp.IsSuccessStatusCode ? (true, null) : (false, $"Discord webhook HTTP {resp.StatusCode}");
                }
            }
            else if (integration.Id == "telegram")
            {
                if (!string.IsNullOrEmpty(destination))
                {
                    var url = $"https://api.telegram.org/bot{token}/sendMessage";
                    var payload = new { chat_id = destination, text = $"[Synapse Result: {workflow}]\n{result}" };
                    var resp = await _http.PostAsJsonAsync(url, payload, ct);
                    return resp.IsSuccessStatusCode ? (true, null) : (false, $"Telegram HTTP {resp.StatusCode}");
                }
            }

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    public async Task<bool> DispatchIntegrationsAsync(
        string result,
        string? prompt,
        string? licenseKey,
        string? machineId,
        WorkflowType workflow,
        TaskComplexity complexity,
        List<string> targetIntegrations,
        CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                result,
                prompt,
                licenseKey,
                machineId,
                workflowType = workflow.ToString().ToLowerInvariant(),
                taskComplexity = complexity.ToString().ToLowerInvariant(),
                targetIntegrations
            };

            var resp = await _http.PostAsJsonAsync($"{BackendUrl}/api/v1/integrations/dispatch", payload, ct);
            return resp.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public Task<List<IntegrationItem>> GetIntegrationStatusesAsync(string machineId, CancellationToken ct = default)
    {
        return Task.FromResult(new List<IntegrationItem>());
    }

    private async Task<JsonArray?> GetOrchestralArrayAsync(string path, CancellationToken ct)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/orchestral/{path}", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonArray>(cancellationToken: ct);
        }
        catch
        {
            return null;
        }
    }

    public async Task<JsonObject?> GetOrchestralStatusAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/orchestral/status", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
        }
        catch { return null; }
    }

    public async Task<List<OrchestralApproval>> GetPendingApprovalsAsync(CancellationToken ct = default)
    {
        var data = await GetOrchestralArrayAsync("approvals", ct);
        return data?.Deserialize<List<OrchestralApproval>>() ?? new List<OrchestralApproval>();
    }

    public async Task<List<OrchestralAgent>> GetOrchestralAgentsAsync(CancellationToken ct = default)
    {
        var data = await GetOrchestralArrayAsync("agents", ct);
        return data?.Deserialize<List<OrchestralAgent>>() ?? new List<OrchestralAgent>();
    }

    public async Task<List<OrchestralFinding>> GetOrchestralFindingsAsync(CancellationToken ct = default)
    {
        var data = await GetOrchestralArrayAsync("findings", ct);
        return data?.Deserialize<List<OrchestralFinding>>() ?? new List<OrchestralFinding>();
    }

    public async Task<List<OrchestralAuditEntry>> GetOrchestralAuditAsync(CancellationToken ct = default)
    {
        var data = await GetOrchestralArrayAsync("audit?limit=50", ct);
        return data?.Deserialize<List<OrchestralAuditEntry>>() ?? new List<OrchestralAuditEntry>();
    }

    public async Task<(bool Ok, string? Error)> ResolveOrchestralApprovalAsync(
        string id, bool approve, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/orchestral/approvals/{Uri.EscapeDataString(id)}/{(approve ? "approve" : "deny")}",
                content: null, ct);
            if (response.IsSuccessStatusCode) return (true, null);
            var error = await response.Content.ReadAsStringAsync(ct);
            return (false, string.IsNullOrWhiteSpace(error) ? $"HTTP {response.StatusCode}" : error);
        }
        catch (Exception ex) { return (false, ex.Message); }
    }

    public async Task<(bool Ok, string? JobId, string? Error)> StartLocalAnalysisAsync(
        string workspace, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/orchestral/jobs/local-analysis",
                content: JsonContent.Create(new { workspace }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (response.IsSuccessStatusCode)
                return (true, body?["job_id"]?.GetValue<string>(), null);
            return (false, null, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception ex) { return (false, null, ex.Message); }
    }

    public async Task<(bool Ok, string? Error)> CancelLocalAnalysisAsync(string jobId, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/orchestral/jobs/{Uri.EscapeDataString(jobId)}/cancel",
                content: null, ct);
            if (response.IsSuccessStatusCode) return (true, null);
            var error = await response.Content.ReadAsStringAsync(ct);
            return (false, string.IsNullOrWhiteSpace(error) ? $"HTTP {response.StatusCode}" : error);
        }
        catch (Exception ex) { return (false, ex.Message); }
    }

    public async Task<JsonObject?> GetLocalAnalysisJobAsync(string jobId, CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/orchestral/jobs/{Uri.EscapeDataString(jobId)}", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
        }
        catch { return null; }
    }

    public async Task<(bool Ok, string? Error)> ConfigureJcodeProviderAsync(string provider, string apiKey, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/provider",
                JsonContent.Create(new { provider, api_key = apiKey }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            return response.IsSuccessStatusCode
                ? (true, null)
                : (false, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception error) { return (false, error.Message); }
    }

    public async Task<(bool Ok, string? Error)> ClearJcodeProviderAsync(string provider, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/provider/clear",
                JsonContent.Create(new { provider }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            return response.IsSuccessStatusCode
                ? (true, null)
                : (false, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception error) { return (false, error.Message); }
    }

    public async Task<JsonObject?> GetJcodeStatusAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/jcode/health", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
        }
        catch { return null; }
    }


    public async Task<List<string>> GetJcodeSessionsAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/jcode/sessions", ct);
            if (!response.IsSuccessStatusCode) return new List<string>();
            var sessions = await response.Content.ReadFromJsonAsync<JsonArray>(cancellationToken: ct);
            return sessions?.Select(item => item?["session_id"]?.GetValue<string>())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .ToList() ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    public async Task<(bool Ok, string? SessionId, string? Error)> CreateJcodeSessionAsync(
        string workspace, string role, string objective, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/sessions",
                content: JsonContent.Create(new { workspace, role, objective }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (response.IsSuccessStatusCode)
                return (true, body?["session_id"]?.GetValue<string>(), null);
            return (false, null, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception ex) { return (false, null, ex.Message); }
    }

    public async Task<List<JsonObject>> GetJcodeEventsAsync(long afterSequence, CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/events?after={afterSequence}", ct);
            if (!response.IsSuccessStatusCode) return new List<JsonObject>();
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            return body?["events"]?.AsArray()
                .Select(item => item?.AsObject())
                .Where(item => item is not null)
                .Select(item => item!)
                .ToList() ?? new List<JsonObject>();
        }
        catch { return new List<JsonObject>(); }
    }

    public async Task<(bool Ok, string? Result, string? Error)> RunJcodeSessionAsync(
        string sessionId, string prompt, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/sessions/{Uri.EscapeDataString(sessionId)}/run",
                content: JsonContent.Create(new { prompt }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (response.IsSuccessStatusCode)
                return (true, body?["text"]?.GetValue<string>() ?? string.Empty, null);
            return (false, null, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception ex) { return (false, null, ex.Message); }
    }

    public async Task<(bool Ok, string? Error)> CancelJcodeSessionAsync(
        string sessionId, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/sessions/{Uri.EscapeDataString(sessionId)}/cancel",
                content: null, ct);
            if (response.IsSuccessStatusCode) return (true, null);
            var error = await response.Content.ReadAsStringAsync(ct);
            return (false, string.IsNullOrWhiteSpace(error) ? $"HTTP {response.StatusCode}" : error);
        }
        catch (Exception ex) { return (false, ex.Message); }
    }


    public async Task<(bool Ok, JsonObject? Batch, string? Error)> StartJcodeBatchAsync(
        string workspace, string role, List<string> tasks, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/swarm",
                content: JsonContent.Create(new { workspace, role, tasks }), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (response.IsSuccessStatusCode)
                return (true, body, null);
            return (false, null, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception ex) { return (false, null, ex.Message); }
    }

    public async Task<JsonObject?> GetJcodeBatchAsync(string batchId, CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/swarm/{Uri.EscapeDataString(batchId)}", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
        }
        catch { return null; }
    }

    public async Task<(bool Ok, string? Error)> CancelJcodeBatchAsync(string batchId, CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/jcode/swarm/{Uri.EscapeDataString(batchId)}/cancel", content: null, ct);
            if (response.IsSuccessStatusCode) return (true, null);
            var error = await response.Content.ReadAsStringAsync(ct);
            return (false, string.IsNullOrWhiteSpace(error) ? $"HTTP {response.StatusCode}" : error);
        }
        catch (Exception ex) { return (false, ex.Message); }
    }

    public async Task<List<WorkerItem>> GetRuntimeStatusAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/runtime/status", ct);
            if (!response.IsSuccessStatusCode) return new();
            return await response.Content.ReadFromJsonAsync<List<WorkerItem>>(cancellationToken: ct) ?? new();
        }
        catch { return new(); }
    }

    public async Task<JsonObject?> ReapIdleWorkersAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await PostWithLocalTokenAsync($"{BackendUrl}/api/v1/runtime/reap-idle", null, ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
        }
        catch { return null; }
    }

    public async Task<List<ToolItem>> ListToolsAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/tools/list", ct);
            if (!response.IsSuccessStatusCode) return new();
            var json = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (json?["tools"] is JsonArray arr)
            {
                var list = new List<ToolItem>();
                foreach (var node in arr)
                {
                    if (node != null)
                    {
                        var item = JsonSerializer.Deserialize<ToolItem>(node.ToJsonString(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (item != null) list.Add(item);
                    }
                }
                return list;
            }
            return new();
        }
        catch { return new(); }
    }

    public async Task<List<MemoryItem>> GetMemoryRecordsAsync(string? query = null, CancellationToken ct = default)
    {
        try
        {
            var url = string.IsNullOrWhiteSpace(query)
                ? $"{BackendUrl}/api/v1/memory"
                : $"{BackendUrl}/api/v1/memory?q={Uri.EscapeDataString(query)}";
            using var response = await GetWithLocalTokenAsync(url, ct);
            if (!response.IsSuccessStatusCode) return new();
            var json = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (json?["records"] is JsonArray arr)
            {
                var list = new List<MemoryItem>();
                foreach (var node in arr)
                {
                    if (node != null)
                    {
                        var item = JsonSerializer.Deserialize<MemoryItem>(node.ToJsonString(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (item != null) list.Add(item);
                    }
                }
                return list;
            }
            return new();
        }
        catch { return new(); }
    }

    public async Task<(bool Ok, MemoryItem? Item, string? Error)> AddMemoryRecordAsync(
        string content, string category, string memoryType, CancellationToken ct = default)
    {
        try
        {
            var payload = new { content, category, memory_type = memoryType };
            using var response = await PostWithLocalTokenAsync(
                $"{BackendUrl}/api/v1/memory/add", JsonContent.Create(payload), ct);
            var body = await response.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: ct);
            if (response.IsSuccessStatusCode && body?["record"] is JsonNode r)
            {
                var item = JsonSerializer.Deserialize<MemoryItem>(r.ToJsonString(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return (true, item, null);
            }
            return (false, null, body?["error"]?.GetValue<string>() ?? $"HTTP {response.StatusCode}");
        }
        catch (Exception ex) { return (false, null, ex.Message); }
    }

    public async Task<bool> DeleteMemoryRecordAsync(string id, CancellationToken ct = default)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Delete, $"{BackendUrl}/api/v1/memory/{Uri.EscapeDataString(id)}");
            using var response = await SendWithLocalTokenAsync(req, ct);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<ModelUsageItem?> GetModelUsageAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await GetWithLocalTokenAsync($"{BackendUrl}/api/v1/models/usage", ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<ModelUsageItem>(cancellationToken: ct, options: new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch { return null; }
    }
}
