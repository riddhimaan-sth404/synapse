@echo off
setlocal enabledelayedexpansion
title Synapse AI Platform Launcher (Tauri Antigravity GUI)

echo ===================================================
echo     Synapse AI Platform Launcher (Tauri GUI)
echo ===================================================
echo.

:: 1. Verify Rust/Cargo
where cargo >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 'cargo' is not found in PATH.
    echo Please install Rust or ensure Cargo is added to PATH.
    pause
    exit /b 1
)

:: 2. Verify Node
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 'node' is not found in PATH.
    echo Please install Node.js [v18+] or ensure node is added to PATH.
    pause
    exit /b 1
)

:: Ensure Vite dev port (1420) is free
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":1420.*LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [*] Starting Synapse Core Backend on port 3001...
start "Synapse Core Backend (Rust)" /d "%~dp0backend-rust" cargo run

echo [*] Waiting for backend and configured Orchestral runtime...
powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(4); while ((Get-Date) -lt $deadline) { try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:3001/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Backend did not become ready within four minutes.
    echo The desktop will still launch; backend-dependent features may be unavailable.
)

echo [*] Launching Synapse Tauri Antigravity Desktop Client...
cd /d "%~dp0desktop-tauri"
call npm.cmd run tauri dev

echo.
echo [*] Application closed.
