@echo off
setlocal

cd /d "%~dp0"

if not defined PORT set "PORT=3000"
if not defined FRONTEND_HOST set "FRONTEND_HOST=127.0.0.1"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5173"

echo == Start Local Backend + Frontend ==
echo.
echo Backend:
echo   http://localhost:%PORT%
echo Frontend:
echo   http://%FRONTEND_HOST%:%FRONTEND_PORT%
echo.

echo Starting backend in a new window...
start "Attendance Backend" /D "%~dp0" cmd /k "set PORT=%PORT%&& call start_backend.cmd"

echo Starting frontend in a new window...
start "Attendance Frontend" /D "%~dp0" cmd /k "set FRONTEND_HOST=%FRONTEND_HOST%&& set FRONTEND_PORT=%FRONTEND_PORT%&& call start_frontend.cmd"

echo Waiting for servers...
timeout /t 5 /nobreak >nul

echo Opening frontend browser...
start "" "http://%FRONTEND_HOST%:%FRONTEND_PORT%"

echo.
echo Keep the backend and frontend windows open while testing.
echo Press any key to close this helper window.
pause >nul
endlocal
exit /b 0
