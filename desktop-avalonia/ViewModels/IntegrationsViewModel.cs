using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Synapse.Desktop.Models;
using Synapse.Desktop.Services;

namespace Synapse.Desktop.ViewModels;

public partial class IntegrationsViewModel : ViewModelBase
{
    private readonly IAgentClientService _agentClient;
    private readonly IOAuthService _oauthService;
    private readonly IHardwareFingerprintService _fingerprintService;
    private readonly ISecureStorageService _storage;

    [ObservableProperty]
    private string _searchQuery = string.Empty;

    public ObservableCollection<IntegrationItem> Integrations { get; } = new();
    public ObservableCollection<IntegrationItem> FilteredIntegrations { get; } = new();

    public IntegrationsViewModel(
        IAgentClientService agentClient,
        IOAuthService oauthService,
        IHardwareFingerprintService fingerprintService,
        ISecureStorageService storage)
    {
        _agentClient = agentClient;
        _oauthService = oauthService;
        _fingerprintService = fingerprintService;
        _storage = storage;

        InitializeIntegrations();
        ApplyFilter();
    }

    private void InitializeIntegrations()
    {
        var defaultItems = new[]
        {
            // --- Google Workspace Suite (Unified Token Pool) ---
            new IntegrationItem
            {
                Id = "google_workspace",
                Name = "Google Workspace (Unified)",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://console.cloud.google.com/apis/credentials",
                Description = "Connect once to authorize Google Docs, Sheets, Drive, Gmail, Calendar, and Slides.",
                CredentialPlaceholder = "Google OAuth Token or Client ID",
                TargetPlaceholder = "Optional domain or workspace account",
                HelpText = "Connect via browser or paste a Google OAuth access token to enable all Google Workspace apps."
            },
            new IntegrationItem
            {
                Id = "google_docs",
                Name = "Google Docs",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://docs.google.com",
                Description = "Read, draft, review, and export documentation directly in Google Docs.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Default Document ID / Folder URL",
                HelpText = "Shares your Google Workspace connection. Output will draft new Google Docs."
            },
            new IntegrationItem
            {
                Id = "google_sheets",
                Name = "Google Sheets",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://sheets.google.com",
                Description = "Append prompt responses, structured data, and audit logs to your spreadsheets.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Spreadsheet ID (from URL)",
                HelpText = "Paste your Spreadsheet ID (e.g. 1BxiMVs0XR...). Rows will be appended on dispatch."
            },
            new IntegrationItem
            {
                Id = "google_drive",
                Name = "Google Drive",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://drive.google.com",
                Description = "Upload files, query knowledge assets, and search repository files in Drive.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Folder ID or Root",
                HelpText = "Shares your Google Workspace connection. Assets and generated reports will upload here."
            },
            new IntegrationItem
            {
                Id = "gmail",
                Name = "Gmail",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://mail.google.com",
                Description = "Draft automated email summaries, reviews, and high-priority agent notifications.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Default recipient email address",
                HelpText = "Drafts emails directly in your Gmail drafts folder for quick review before sending."
            },
            new IntegrationItem
            {
                Id = "google_calendar",
                Name = "Google Calendar",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://calendar.google.com",
                Description = "Inspect schedule availability, plan agendas, and register meeting slots.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Calendar ID (default 'primary')",
                HelpText = "Allows the agent to check busy times and draft event invitations."
            },
            new IntegrationItem
            {
                Id = "google_slides",
                Name = "Google Slides",
                Category = "Google Workspace",
                OAuthProvider = "google",
                SharedProvider = "google",
                SetupMode = "Google",
                BrowserAuthUrl = "https://slides.google.com",
                Description = "Draft and review structured presentations and executive summaries in Slides.",
                CredentialPlaceholder = "Uses Google Workspace token",
                TargetPlaceholder = "Presentation ID or Template ID",
                HelpText = "Shares your Google Workspace connection to create or update slide decks."
            },

            // --- Developer & Product Tools ---
            new IntegrationItem
            {
                Id = "github",
                Name = "GitHub",
                Category = "Engineering & Product",
                OAuthProvider = "github",
                SetupMode = "Token",
                BrowserAuthUrl = "https://github.com/settings/tokens/new?description=Synapse%20AI%20Platform&scopes=repo,read:org,workflow",
                Description = "Create issues, automate pull request reviews, and post execution summaries.",
                CredentialPlaceholder = "Personal Access Token (ghp_...)",
                TargetPlaceholder = "owner/repository (e.g. org/repo)",
                HelpText = "1-Click: Click 'Open Setup in Browser' to generate a token with repo permissions pre-selected, then Paste & Connect."
            },
            new IntegrationItem
            {
                Id = "linear",
                Name = "Linear",
                Category = "Engineering & Product",
                OAuthProvider = "linear",
                SetupMode = "Token",
                BrowserAuthUrl = "https://linear.app/settings/api",
                Description = "Create issues, triage bugs, and manage sprints with AI assistance.",
                CredentialPlaceholder = "Linear API Key (lin_api_...)",
                TargetPlaceholder = "Team Key (e.g. ENG)",
                HelpText = "Open Linear API settings, create a Personal API key, and click 'Paste & Connect'."
            },
            new IntegrationItem
            {
                Id = "jira",
                Name = "Jira",
                Category = "Engineering & Product",
                OAuthProvider = "jira",
                SetupMode = "Token",
                BrowserAuthUrl = "https://id.atlassian.com/manage-profile/security/api-tokens",
                Description = "Log work and create Jira tickets from agent execution results.",
                CredentialPlaceholder = "Atlassian API Token",
                TargetPlaceholder = "Project Key (e.g. PROJ)",
                HelpText = "Create an API token in your Atlassian account security center and paste it here."
            },

            // --- Communications ---
            new IntegrationItem
            {
                Id = "slack",
                Name = "Slack",
                Category = "Communications",
                OAuthProvider = "slack",
                SetupMode = "Webhook",
                BrowserAuthUrl = "https://api.slack.com/apps?new_app=1",
                Description = "Post agent results to your Slack channel via incoming webhook or bot token.",
                CredentialPlaceholder = "Webhook URL (https://hooks.slack.com/...) or Bot Token",
                TargetPlaceholder = "#channel-name (e.g. #general)",
                HelpText = "Simplest setup: Create an Incoming Webhook in your Slack workspace and paste the URL."
            },
            new IntegrationItem
            {
                Id = "discord",
                Name = "Discord",
                Category = "Communications",
                OAuthProvider = "discord",
                SetupMode = "Webhook",
                BrowserAuthUrl = "https://discord.com/developers/docs/resources/webhook",
                Description = "Post prompt results and agent alerts directly into Discord channels.",
                CredentialPlaceholder = "Webhook URL (https://discord.com/api/webhooks/...)",
                TargetPlaceholder = "Optional display username",
                HelpText = "In Discord: Channel Settings -> Integrations -> Webhooks -> Copy Webhook URL. Paste & Connect!"
            },
            new IntegrationItem
            {
                Id = "telegram",
                Name = "Telegram",
                Category = "Communications",
                OAuthProvider = "telegram",
                SetupMode = "Token",
                BrowserAuthUrl = "https://t.me/BotFather",
                Description = "Send instant messages and agent progress updates via Telegram bot.",
                CredentialPlaceholder = "Bot Token from @BotFather",
                TargetPlaceholder = "Chat ID (e.g. 123456789 or @channel)",
                HelpText = "Message @BotFather on Telegram to create a bot, copy the token, and provide your Chat ID."
            },

            // --- Knowledge & Data ---
            new IntegrationItem
            {
                Id = "notion",
                Name = "Notion",
                Category = "Knowledge & Data",
                OAuthProvider = "notion",
                SetupMode = "Token",
                BrowserAuthUrl = "https://www.notion.so/my-integrations",
                Description = "Sync notes, databases, and structured documents directly into Notion.",
                CredentialPlaceholder = "Internal Integration Secret (secret_...)",
                TargetPlaceholder = "Database ID (from database URL)",
                HelpText = "Create an integration at notion.so/my-integrations, copy the secret, and share your database with it."
            },
            new IntegrationItem
            {
                Id = "confluence",
                Name = "Confluence",
                Category = "Knowledge & Data",
                OAuthProvider = "confluence",
                SetupMode = "Token",
                BrowserAuthUrl = "https://id.atlassian.com/manage-profile/security/api-tokens",
                Description = "Publish generated documents and notes to Confluence spaces.",
                CredentialPlaceholder = "Atlassian API Token",
                TargetPlaceholder = "Space Key (e.g. DOCS)",
                HelpText = "Uses your Atlassian API token to publish pages into the configured Confluence space."
            },

            // --- CRM & Sales ---
            new IntegrationItem
            {
                Id = "hubspot",
                Name = "HubSpot",
                Category = "CRM & Sales",
                OAuthProvider = "hubspot",
                SetupMode = "Token",
                BrowserAuthUrl = "https://app.hubspot.com/l/private-apps",
                Description = "Sync drafts and extracted contact records into HubSpot CRM.",
                CredentialPlaceholder = "Private App Access Token (pat-na1-...)",
                TargetPlaceholder = "Default Pipeline / Owner ID",
                HelpText = "Create a Private App in HubSpot Settings -> Integrations -> Private Apps, and paste the access token."
            },
            new IntegrationItem
            {
                Id = "salesforce",
                Name = "Salesforce",
                Category = "CRM & Sales",
                OAuthProvider = "salesforce",
                SetupMode = "OAuth",
                BrowserAuthUrl = "https://login.salesforce.com",
                Description = "Create leads and log AI interactions directly in Salesforce.",
                CredentialPlaceholder = "Connected App Client ID",
                TargetPlaceholder = "Instance URL",
                HelpText = "Provide your Salesforce Connected App Client ID to initiate OAuth sign-in."
            }
        };

        // Shared Google Workspace token check
        var sharedGoogleToken = _storage.GetSecret("integration_google_token");

        foreach (var item in defaultItems)
        {
            var savedToken = _storage.GetSecret($"integration_{item.Id}_token");
            if (string.IsNullOrEmpty(savedToken) && item.SharedProvider == "google")
            {
                savedToken = sharedGoogleToken;
            }

            var savedTarget = _storage.GetSecret($"integration_{item.Id}_target");
            var savedClientId = _storage.GetSecret($"integration_{item.Id}_clientid");

            if (!string.IsNullOrEmpty(savedToken))
            {
                item.ApiKeyOrToken = savedToken;
                item.IsConnected = true;
                item.StatusText = "Connected";
            }

            if (!string.IsNullOrEmpty(savedTarget))
                item.TargetDestination = savedTarget;

            if (!string.IsNullOrEmpty(savedClientId))
                item.ClientId = savedClientId;

            Integrations.Add(item);
        }
    }

    partial void OnSearchQueryChanged(string value)
    {
        ApplyFilter();
    }

    private void ApplyFilter()
    {
        FilteredIntegrations.Clear();
        var query = SearchQuery.Trim().ToLowerInvariant();

        foreach (var item in Integrations)
        {
            if (string.IsNullOrEmpty(query) ||
                item.Name.ToLowerInvariant().Contains(query) ||
                item.Category.ToLowerInvariant().Contains(query))
            {
                FilteredIntegrations.Add(item);
            }
        }
    }

    [RelayCommand]
    public void ToggleConfigure(IntegrationItem item)
    {
        item.IsConfiguring = !item.IsConfiguring;
    }

    [RelayCommand]
    public async Task ToggleDispatchAsync(IntegrationItem item)
    {
        if (item.IsSelected && !item.IsConnected)
        {
            item.IsConfiguring = true;
            await ConnectBrowserAuthAsync(item);
        }
    }

    [RelayCommand]
    public async Task ConnectBrowserAuthAsync(IntegrationItem item)
    {
        item.StatusText = "Opening browser...";

        // 1. Direct Loopback OAuth Flow if Client ID is provided
        if (item.SetupMode == "OAuth" && !string.IsNullOrWhiteSpace(item.ClientId))
        {
            var machineId = _fingerprintService.GetMachineId();
            var (success, token) = await _oauthService.StartOAuthAsync(
                item.OAuthProvider,
                machineId,
                _agentClient.BackendUrl,
                item.ClientId);

            if (success)
            {
                if (!string.IsNullOrWhiteSpace(token))
                {
                    item.ApiKeyOrToken = token;
                    SaveTokenAndSyncShared(item, token);
                }
                item.IsConnected = true;
                item.StatusText = "Connected";
                item.IsSelected = true;
                item.IsConfiguring = false;
                return;
            }
        }

        // 2. Direct Pre-Filled Setup Page in User's Default Browser
        if (!string.IsNullOrWhiteSpace(item.BrowserAuthUrl))
        {
            _oauthService.OpenBrowser(item.BrowserAuthUrl);
            item.StatusText = "Browser opened. Copy token and click 'Paste & Connect'.";
            item.IsConfiguring = true;
        }
        else
        {
            item.StatusText = "Disconnected";
        }
    }

    [RelayCommand]
    public async Task PasteAndConnectAsync(IntegrationItem item)
    {
        try
        {
            string? clipboardText = null;
            if (Application.Current?.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop && desktop.MainWindow?.Clipboard != null)
            {
                clipboardText = await desktop.MainWindow.Clipboard.GetTextAsync();
            }

            if (!string.IsNullOrWhiteSpace(clipboardText))
            {
                var token = clipboardText.Trim();
                item.ApiKeyOrToken = token;
                SaveTokenAndSyncShared(item, token);
                item.IsConnected = true;
                item.StatusText = "Connected";
                item.IsSelected = true;
                item.IsConfiguring = false;
            }
            else
            {
                item.StatusText = "Clipboard is empty. Copy your token first.";
            }
        }
        catch (Exception ex)
        {
            item.StatusText = $"Clipboard read error: {ex.Message}";
        }
    }

    [RelayCommand]
    public void SaveIntegrationCredentials(IntegrationItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.ApiKeyOrToken))
        {
            SaveTokenAndSyncShared(item, item.ApiKeyOrToken.Trim());
            item.IsConnected = true;
            item.StatusText = "Connected";
            item.IsSelected = true;
        }
        else
        {
            _storage.RemoveSecret($"integration_{item.Id}_token");
            if (item.SharedProvider == "google")
            {
                _storage.RemoveSecret("integration_google_token");
                foreach (var g in Integrations.Where(i => i.SharedProvider == "google"))
                {
                    g.ApiKeyOrToken = string.Empty;
                    g.IsConnected = false;
                    g.StatusText = "Disconnected";
                    g.IsSelected = false;
                }
            }
            item.IsConnected = false;
            item.StatusText = "Disconnected";
            item.IsSelected = false;
        }

        if (!string.IsNullOrWhiteSpace(item.TargetDestination))
            _storage.SaveSecret($"integration_{item.Id}_target", item.TargetDestination.Trim());

        if (!string.IsNullOrWhiteSpace(item.ClientId))
            _storage.SaveSecret($"integration_{item.Id}_clientid", item.ClientId.Trim());

        item.IsConfiguring = false;
    }

    private void SaveTokenAndSyncShared(IntegrationItem item, string token)
    {
        _storage.SaveSecret($"integration_{item.Id}_token", token);

        // If this is a Google Workspace app, synchronize the single token across all Google Workspace tools!
        if (item.SharedProvider == "google")
        {
            _storage.SaveSecret("integration_google_token", token);
            foreach (var g in Integrations.Where(i => i.SharedProvider == "google"))
            {
                g.ApiKeyOrToken = token;
                g.IsConnected = true;
                g.StatusText = "Connected";
            }
        }
    }

    [RelayCommand]
    public async Task ConnectOAuthAsync(IntegrationItem item)
    {
        await ConnectBrowserAuthAsync(item);
    }
}
