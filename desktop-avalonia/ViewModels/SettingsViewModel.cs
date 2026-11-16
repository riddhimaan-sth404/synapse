using System;
using Avalonia;
using Avalonia.Styling;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Synapse.Desktop.Services;

namespace Synapse.Desktop.ViewModels;

public partial class SettingsViewModel : ViewModelBase
{
    private readonly IAgentClientService _agentClient;
    private readonly ISecureStorageService _storage;
    private readonly IHardwareFingerprintService _fingerprintService;

    [ObservableProperty]
    private string _backendUrl;

    [ObservableProperty]
    private string _machineId;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private bool _isDarkTheme;

    [ObservableProperty]
    private bool _isSoftwareEngineering = true;

    [ObservableProperty]
    private bool _isKnowledgeWork = false;

    [ObservableProperty]
    private string _permissionPreset = "Turbo";

    [ObservableProperty]
    private bool _queuedMessages = false;

    [ObservableProperty]
    private string _voiceName = "Not set";

    [ObservableProperty]
    private string _microphoneName = "System default";

    [ObservableProperty]
    private double _voiceVolume = 100.0;

    public string[] AvailablePermissionPresets { get; } = new[] { "Turbo", "Standard", "Strict" };

    public SettingsViewModel(
        IAgentClientService agentClient,
        ISecureStorageService storage,
        IHardwareFingerprintService fingerprintService)
    {
        _agentClient = agentClient;
        _storage = storage;
        _fingerprintService = fingerprintService;

        _backendUrl = _agentClient.BackendUrl;
        _machineId = _fingerprintService.GetMachineId();
        _isDarkTheme = Application.Current?.ActualThemeVariant == ThemeVariant.Dark;
    }

    [RelayCommand]
    public void SelectSoftwareEngineering()
    {
        IsSoftwareEngineering = true;
        IsKnowledgeWork = false;
    }

    [RelayCommand]
    public void SelectKnowledgeWork()
    {
        IsSoftwareEngineering = false;
        IsKnowledgeWork = true;
    }

    partial void OnIsDarkThemeChanged(bool value)
    {
        if (Application.Current is { } app)
            app.RequestedThemeVariant = value ? ThemeVariant.Dark : ThemeVariant.Light;
    }

    [RelayCommand]
    public void SaveSettings()
    {
        _agentClient.BackendUrl = BackendUrl.Trim();
        _storage.SaveSecret("backend_url", BackendUrl.Trim());
        StatusMessage = "Settings saved successfully!";
    }
}
