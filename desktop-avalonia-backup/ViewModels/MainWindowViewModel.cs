using System;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Synapse.Desktop.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    public AgentViewModel AgentVm { get; }
    public IntegrationsViewModel IntegrationsVm { get; }
    public LocalAiViewModel LocalAiVm { get; }
    public SettingsViewModel SettingsVm { get; }
    public OrchestralViewModel OrchestralVm { get; }

    [ObservableProperty]
    private ViewModelBase _currentView;

    [ObservableProperty]
    private string _activeSection = "agent";

    [ObservableProperty]
    private bool _isInspectorOpen = true;

    [ObservableProperty]
    private int _subagentsCount = 3;

    [ObservableProperty]
    private int _backgroundTasksCount = 4;

    [ObservableProperty]
    private int _artifactsCount = 3;

    public bool IsAgentActive => ActiveSection == "agent";
    public bool IsOrchestralActive => ActiveSection == "orchestral";
    public bool IsIntegrationsActive => ActiveSection == "integrations";
    public bool IsLocalAiActive => ActiveSection == "local-ai";
    public bool IsSettingsActive => ActiveSection == "settings";

    public string ActiveSectionTitle => ActiveSection switch
    {
        "integrations" => "Connected apps",
        "local-ai" => "Local AI",
        "settings" => "Settings",
        "orchestral" => "Workflows and Citadel",
        _ => "AI Assistant"
    };

    public MainWindowViewModel(
        AgentViewModel agentVm,
        IntegrationsViewModel integrationsVm,
        LocalAiViewModel localAiVm,
        SettingsViewModel settingsVm,
        OrchestralViewModel orchestralVm)
    {
        AgentVm = agentVm;
        IntegrationsVm = integrationsVm;
        LocalAiVm = localAiVm;
        SettingsVm = settingsVm;
        OrchestralVm = orchestralVm;

        _currentView = AgentVm;
    }

    partial void OnActiveSectionChanged(string value)
    {
        OnPropertyChanged(nameof(IsAgentActive));
        OnPropertyChanged(nameof(IsOrchestralActive));
        OnPropertyChanged(nameof(IsIntegrationsActive));
        OnPropertyChanged(nameof(IsLocalAiActive));
        OnPropertyChanged(nameof(IsSettingsActive));
        OnPropertyChanged(nameof(ActiveSectionTitle));
    }

    [RelayCommand]
    public void NewConversation()
    {
        AgentVm.ClearLogsCommand.Execute(null);
        Navigate("agent");
    }

    [RelayCommand]
    public void ToggleInspector()
    {
        IsInspectorOpen = !IsInspectorOpen;
    }

    [RelayCommand]
    public void OpenIde()
    {
        try
        {
            var p = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c code .",
                CreateNoWindow = true,
                UseShellExecute = false
            };
            System.Diagnostics.Process.Start(p);
        }
        catch { }
    }

    [RelayCommand]
    public void Navigate(string section)
    {
        ActiveSection = section;
        CurrentView = section switch
        {
            "integrations" => IntegrationsVm,
            "local-ai" => LocalAiVm,
            "settings" => SettingsVm,
            "orchestral" => OrchestralVm,
            _ => AgentVm
        };
    }
}
