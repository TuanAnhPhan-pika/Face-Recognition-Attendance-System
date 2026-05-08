#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "== Camera client setup for Windows Git Bash =="
echo "Working directory: $(pwd)"

PYTHON_CMD=()

if command -v py >/dev/null 2>&1; then
  if py -3.10 -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 10) else 1)" >/dev/null 2>&1; then
    PYTHON_CMD=(py -3.10)
  fi
fi

if [ "${#PYTHON_CMD[@]}" -eq 0 ]; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_CMD=(python)
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD=(python3)
  else
    echo "ERROR: Python was not found. Install Python 3.10 64-bit first."
    exit 1
  fi
fi

PY_VERSION="$("${PYTHON_CMD[@]}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')")"
PY_MAJOR_MINOR="$("${PYTHON_CMD[@]}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")"

echo "Using Python: ${PY_VERSION}"

if [ "${PY_MAJOR_MINOR}" != "3.10" ]; then
  echo "WARNING: Python 3.10 is recommended for face_recognition/dlib on Windows."
  echo "Current Python is ${PY_VERSION}. If install fails, install Python 3.10 and rerun this script."
fi

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment: camera_client/.venv"
  "${PYTHON_CMD[@]}" -m venv .venv
else
  echo "Virtual environment already exists: camera_client/.venv"
fi

VENV_PY=".venv/Scripts/python.exe"
if [ ! -f "${VENV_PY}" ]; then
  VENV_PY=".venv/Scripts/python"
fi

if [ ! -f "${VENV_PY}" ]; then
  echo "ERROR: Cannot find venv Python in .venv/Scripts"
  exit 1
fi

echo "Upgrading pip..."
"${VENV_PY}" -m pip install --upgrade pip

echo "Installing camera dependencies..."
"${VENV_PY}" -m pip install -r requirements.txt

echo "Checking imports..."
"${VENV_PY}" - <<'PY'
import cv2
import face_recognition
import flask
import requests

print("cv2:", cv2.__version__)
print("face_recognition:", getattr(face_recognition, "__version__", "ok"))
print("flask:", flask.__version__)
print("requests:", requests.__version__)
PY

echo ""
echo "Setup completed."
echo ""
echo "Run camera client with:"
echo "  source .venv/Scripts/activate"
echo "  python py_client.py --backend http://BACKEND_IP:3000 --device iot-cam-01 --interval 2"
echo ""
echo "Then open this stream on the frontend:"
echo "  http://CAMERA_LAPTOP_IP:5001/video_feed"
