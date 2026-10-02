@echo off
setlocal

cd /d "%~dp0backend"

echo == Face Attendance Backend ==
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
  echo Installing backend dependencies...
  npm install
  if errorlevel 1 goto fail
)

if not defined PORT set "PORT=3000"

echo.
echo Backend URL:
echo   http://localhost:%PORT%
echo.
echo For LAN demo, find this laptop IP with: ipconfig
echo Example backend URL for other laptops:
echo   http://YOUR_BACKEND_IP:%PORT%
echo.
echo Press Ctrl+C to stop.
echo.

npm start
if errorlevel 1 goto fail

goto done

:fail
echo.
echo Backend failed. Read the error above.
pause
endlocal
exit /b 1

:done
echo.
echo Backend stopped.
pause
endlocal
exit /b 0
