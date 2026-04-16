# ================================================================================
# FACE RECOGNITION ATTENDANCE SYSTEM - AUTOMATIC SETUP SCRIPT (Windows)
# ================================================================================
# Usage: powershell -ExecutionPolicy Bypass -File setup.ps1
# This script will install all dependencies and download models automatically
# ================================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Face Recognition Attendance System" -ForegroundColor Cyan
Write-Host "Automatic Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ===== CHECK PREREQUISITES =====
Write-Host "[1/5] Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
$node = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Node.js found: $node"
} else {
    Write-Host "  ✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
$npm = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ npm found: v$npm"
} else {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Python
$python = python --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Python found: $python"
} else {
    Write-Host "  ✗ Python not found. Please install from https://www.python.org/" -ForegroundColor Red
    exit 1
}

# Check pip
$pip = pip --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ pip found: $pip"
} else {
    Write-Host "  ✗ pip not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===== INSTALL NODE DEPENDENCIES =====
Write-Host "[2/5] Installing Backend Node.js Dependencies..." -ForegroundColor Yellow

if (Test-Path "backend/node_modules") {
    Write-Host "  - node_modules already exists, skipping..."
} else {
    Push-Location "backend"
    Write-Host "  - Running: npm install"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "  ✓ Backend dependencies installed"
    Pop-Location
}

Write-Host ""

# ===== INSTALL PYTHON DEPENDENCIES =====
Write-Host "[3/5] Installing Python Dependencies..." -ForegroundColor Yellow

$pythonReqs = "camera_client/requirements.txt"
if (Test-Path $pythonReqs) {
    Write-Host "  - Running: pip install -r $pythonReqs"
    pip install -r $pythonReqs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ pip install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Python dependencies installed"
} else {
    Write-Host "  ✗ requirements.txt not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===== DOWNLOAD FACE-API MODELS =====
Write-Host "[4/5] Downloading Face-API Models..." -ForegroundColor Yellow

$scriptPath = "scripts/download_faceapi_models.js"
if (Test-Path $scriptPath) {
    Write-Host "  - Running: node download_faceapi_models.js"
    Push-Location "scripts"
    node download_faceapi_models.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Model download failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "  ✓ Models downloaded successfully"
    Pop-Location
} else {
    Write-Host "  ✗ download_faceapi_models.js not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===== SETUP BACKEND CONFIGURATION =====
Write-Host "[5/5] Setting up Backend Configuration..." -ForegroundColor Yellow

$envFile = "backend/.env"
$envExample = "backend/.env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Host "  - Creating .env from .env.example"
        Copy-Item $envExample $envFile
        Write-Host "  ✓ .env created. Please update with your configuration:"
        Write-Host "    - DATABASE: SQLite (default) or SQL Server"
        Write-Host "    - ADMIN_TOKEN: Change to secure token"
        Write-Host "    - EMBEDDING_THRESHOLD: 0.5-0.6 recommended"
        Write-Host "    - Edit: $envFile"
    } else {
        Write-Host "  ✗ .env.example not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  - .env already exists, keeping current configuration"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review and update backend/.env if needed"
Write-Host "2. Start backend: cd backend && npm run dev"
Write-Host "3. Open browser: frontend_client/index.html"
Write-Host "4. (Optional) Run camera client: python camera_client/py_client.py"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - requirements.txt - Full dependency list"
Write-Host "  - NODE_REQUIREMENTS.md - Node.js setup details"
Write-Host "  - setup.md - Detailed setup instructions"
Write-Host "  - docs/data_flow.md - System architecture"
Write-Host ""
