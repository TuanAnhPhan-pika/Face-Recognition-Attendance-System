@echo off
setlocal

cd /d "%~dp0frontend_client"

echo == Face Attendance Frontend ==
echo Working directory: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found. Install Node.js first.
  goto fail
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js with npm first.
  goto fail
)

if not exist "node_modules" (
  echo Installing frontend dependencies...
  npm install
  if errorlevel 1 goto fail
)

if not defined FRONTEND_HOST set "FRONTEND_HOST=127.0.0.1"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5173"

echo.
echo Frontend URL:
echo   http://%FRONTEND_HOST%:%FRONTEND_PORT%
echo.
echo Backend URL inside the page should be:
echo   http://localhost:3000
echo or for LAN:
echo   http://YOUR_BACKEND_IP:3000
echo.
echo Press Ctrl+C to stop.
echo.

npm run dev -- --host %FRONTEND_HOST% --port %FRONTEND_PORT%
if errorlevel 1 goto fail

goto done

:fail
echo.
echo Frontend failed. Read the error above.
pause
endlocal
exit /b 1

:done
echo.
echo Frontend stopped.
pause
endlocal
exit /b 0
