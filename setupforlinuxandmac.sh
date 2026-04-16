#!/bin/bash
# ================================================================================
# FACE RECOGNITION ATTENDANCE SYSTEM - AUTOMATIC SETUP SCRIPT (Linux/Mac)
# ================================================================================
# Usage: bash setup.sh
# This script will install all dependencies and download models automatically
# ================================================================================

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}Face Recognition Attendance System${NC}"
echo -e "${CYAN}Automatic Setup Script${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# ===== CHECK PREREQUISITES =====
echo -e "${YELLOW}[1/5] Checking Prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install from https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "  ${GREEN}✓${NC} Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "  ${GREEN}✓${NC} npm found: v$NPM_VERSION"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python not found. Please install from https://www.python.org/${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "  ${GREEN}✓${NC} Python found: $PYTHON_VERSION"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗ pip not found${NC}"
    exit 1
fi
PIP_VERSION=$(pip3 --version)
echo -e "  ${GREEN}✓${NC} pip found: $PIP_VERSION"

echo ""

# ===== INSTALL NODE DEPENDENCIES =====
echo -e "${YELLOW}[2/5] Installing Backend Node.js Dependencies...${NC}"

if [ -d "backend/node_modules" ]; then
    echo "  - node_modules already exists, skipping..."
else
    echo "  - Running: npm install"
    cd backend
    npm install
    cd ..
    echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
fi

echo ""

# ===== INSTALL PYTHON DEPENDENCIES =====
echo -e "${YELLOW}[3/5] Installing Python Dependencies...${NC}"

PYTHON_REQS="camera_client/requirements.txt"
if [ -f "$PYTHON_REQS" ]; then
    echo "  - Running: pip3 install -r $PYTHON_REQS"
    pip3 install -r "$PYTHON_REQS"
    echo -e "  ${GREEN}✓${NC} Python dependencies installed"
else
    echo -e "  ${RED}✗ requirements.txt not found${NC}"
    exit 1
fi

echo ""

# ===== DOWNLOAD FACE-API MODELS =====
echo -e "${YELLOW}[4/5] Downloading Face-API Models...${NC}"

SCRIPT_PATH="scripts/download_faceapi_models.js"
if [ -f "$SCRIPT_PATH" ]; then
    echo "  - Running: node download_faceapi_models.js"
    cd scripts
    node download_faceapi_models.js
    cd ..
    echo -e "  ${GREEN}✓${NC} Models downloaded successfully"
else
    echo -e "  ${RED}✗ download_faceapi_models.js not found${NC}"
    exit 1
fi

echo ""

# ===== SETUP BACKEND CONFIGURATION =====
echo -e "${YELLOW}[5/5] Setting up Backend Configuration...${NC}"

ENV_FILE="backend/.env"
ENV_EXAMPLE="backend/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        echo "  - Creating .env from .env.example"
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo -e "  ${GREEN}✓${NC} .env created. Please update with your configuration:"
        echo "    - DATABASE: SQLite (default) or SQL Server"
        echo "    - ADMIN_TOKEN: Change to secure token"
        echo "    - EMBEDDING_THRESHOLD: 0.5-0.6 recommended"
        echo "    - Edit: $ENV_FILE"
    else
        echo -e "  ${RED}✗ .env.example not found${NC}"
        exit 1
    fi
else
    echo "  - .env already exists, keeping current configuration"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "1. Review and update backend/.env if needed"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Open browser: frontend_client/index.html"
echo "4. (Optional) Run camera client: python3 camera_client/py_client.py"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "  - requirements.txt - Full dependency list"
echo "  - NODE_REQUIREMENTS.md - Node.js setup details"
echo "  - setup.md - Detailed setup instructions"
echo "  - docs/data_flow.md - System architecture"
echo ""
