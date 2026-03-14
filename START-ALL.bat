@echo off
title AI Life Efficiency - Launcher
color 0E
echo.
echo ==========================================
echo   AI Life Efficiency - Full Launcher
echo ==========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

echo Starting Backend...
start "AI Backend (port 8000)" cmd /k "cd /d %~dp0 && start-backend.bat"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Dashboard...
start "AI Dashboard (port 3000)" cmd /k "cd /d %~dp0 && start-dashboard.bat"

echo.
echo Both servers starting...
echo.
echo   Backend:   http://localhost:8000
echo   Dashboard: http://localhost:3000
echo.
echo Opening browser in 6 seconds...
timeout /t 6 /nobreak >nul
start http://localhost:3000
echo.
echo Done. You can close this window.
pause
