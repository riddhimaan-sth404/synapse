using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Synapse.Desktop.Services;

public interface IOAuthService
{
    Task<(bool Ok, string? Token)> StartOAuthAsync(string provider, string machineId, string backendUrl, string? clientId = null, CancellationToken ct = default);
    void OpenBrowser(string url);
}

public class OAuthService : IOAuthService
{
    public async Task<(bool Ok, string? Token)> StartOAuthAsync(string provider, string machineId, string backendUrl, string? clientId = null, CancellationToken ct = default)
    {
        var authUrl = $"{backendUrl}/api/v1/auth/{provider}/connect?machineId={Uri.EscapeDataString(machineId)}";
        if (!string.IsNullOrWhiteSpace(clientId))
        {
            authUrl += $"&clientId={Uri.EscapeDataString(clientId.Trim())}";
        }

        OpenBrowser(authUrl);

        var tempDir = Path.Combine(Path.GetTempPath(), "synapse-oauth");
        Directory.CreateDirectory(tempDir);
        var signalFile = Path.Combine(tempDir, $"{machineId}_{provider}");

        // Clean up any stale signal file
        if (File.Exists(signalFile))
        {
            try { File.Delete(signalFile); } catch { }
        }

        // Wait up to 120s for authentication callback completion
        for (int i = 0; i < 120; i++)
        {
            if (ct.IsCancellationRequested)
                return (false, null);

            if (File.Exists(signalFile))
            {
                string? token = null;
                try
                {
                    var content = File.ReadAllText(signalFile).Trim();
                    if (!string.IsNullOrEmpty(content))
                    {
                        if (content.StartsWith("{"))
                        {
                            using var doc = JsonDocument.Parse(content);
                            if (doc.RootElement.TryGetProperty("token", out var tokenProp))
                            {
                                token = tokenProp.GetString();
                            }
                        }
                        else
                        {
                            token = content;
                        }
                    }
                }
                catch
                {
                    // Ignore parse error; fallback to signal confirmation
                }

                try { File.Delete(signalFile); } catch { }
                return (true, token);
            }

            await Task.Delay(1000, ct);
        }

        return (false, null);
    }

    public void OpenBrowser(string url)
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                Process.Start("xdg-open", url);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                Process.Start("open", url);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[OAuthService] Failed to open browser: {ex.Message}");
        }
    }
}
