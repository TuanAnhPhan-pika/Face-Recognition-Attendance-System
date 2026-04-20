# ================================================================================
# FACE RECOGNITION ATTENDANCE SYSTEM - WINDOWS LAUNCHER
# ================================================================================
# Usage: powershell -ExecutionPolicy Bypass -File setup.ps1
# This script starts the backend and opens the frontend in the browser.
# ================================================================================

$ErrorActionPreference = 'Stop'

$repoRoot = $PSScriptRoot
if (-not $repoRoot) {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

Set-Location $repoRoot

function Write-Section {
    param([string]$Text)
    Write-Host ''
    Write-Host $Text -ForegroundColor Yellow
}

function Assert-Command {
    param(
        [string]$Name,
        [string]$Message
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Host $Message -ForegroundColor Red
        exit 1
    }
}

function Start-DetachedProcess {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$WorkingDirectory,
        [string]$WindowTitle
    )

    $escapedWorkingDirectory = $WorkingDirectory.Replace("'", "''")
    $escapedCommand = $Command.Replace("'", "''")
    $argumentText = ($Arguments | ForEach-Object { $_.Replace("'", "''") }) -join ' '
    $scriptText = "`$Host.UI.RawUI.WindowTitle = '$WindowTitle'; Set-Location '$escapedWorkingDirectory'; & $escapedCommand $argumentText"
    Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit', '-Command', $scriptText) | Out-Null
}

Write-Host '================================' -ForegroundColor Cyan
Write-Host 'Face Recognition Attendance System' -ForegroundColor Cyan
Write-Host 'Windows Launcher' -ForegroundColor Cyan
Write-Host '================================' -ForegroundColor Cyan

Write-Section '[1/2] Checking Prerequisites...'
Assert-Command 'node' 'Node.js not found. Please install from https://nodejs.org/'
Assert-Command 'npm' 'npm not found'
Write-Host '  OK Node.js and npm found.'

$backendDir = Join-Path $repoRoot 'backend'
$frontendUrl = 'http://localhost:3000/frontend/index.html'

Write-Section '[2/2] Starting Backend and Frontend...'
Write-Host '  Starting backend in a separate PowerShell window...'
Start-DetachedProcess -Command 'npm' -Arguments @('start') -WorkingDirectory $backendDir -WindowTitle 'FRA Backend'

Start-Sleep -Seconds 2
Write-Host '  Opening frontend in the browser...'
Start-Process $frontendUrl | Out-Null

Write-Host ''
Write-Host '================================' -ForegroundColor Green
Write-Host 'Launcher started!' -ForegroundColor Green
Write-Host '================================' -ForegroundColor Green
Write-Host "Frontend: $frontendUrl"
Write-Host 'Backend:  backend/index.js (opened in a new PowerShell window)'
Write-Host ''