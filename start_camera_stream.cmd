@echo off
setlocal

cd /d "%~dp0camera_client"

echo == Camera Client Stream ==
echo Working directory: %CD%
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python was not found. Install Python first.
  goto fail
)

if not defined BACKEND_URL set "BACKEND_URL=http://localhost:3000"
if not defined CAMERA_SOURCE set "CAMERA_SOURCE=0"
if not defined CAMERA_PORT set "CAMERA_PORT=5001"
if not defined DEVICE_ID set "DEVICE_ID=py-cam-01"

echo Checking Python dependencies...
python -c "import cv2, face_recognition, flask, requests" >nul 2>nul
if errorlevel 1 (
  echo Missing Python dependencies. Installing from camera_client\requirements.txt...
  python -m pip install -r requirements.txt
  if errorlevel 1 goto fail
) else (
  echo Python dependencies found.
)

echo Backend URL:
echo   %BACKEND_URL%
echo Camera source:
echo   %CAMERA_SOURCE%
echo Stream URL on this laptop:
echo   http://YOUR_CAMERA_LAPTOP_IP:%CAMERA_PORT%/video_feed
echo.
echo Press Ctrl+C to stop.
echo.

python py_client.py --backend "%BACKEND_URL%" --camera "%CAMERA_SOURCE%" --stream-port %CAMERA_PORT% --device "%DEVICE_ID%"
if errorlevel 1 goto fail

goto done

:fail
echo.
echo Camera client failed. Read the error above.
pause
endlocal
exit /b 1

:done
echo.
echo Camera client stopped.
pause
endlocal
exit /b 0
