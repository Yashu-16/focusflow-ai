@echo off
title AI Efficiency - Dashboard
color 0B
echo.
echo ==========================================
echo   AI Life Efficiency - Dashboard
echo ==========================================
echo.

:: Stay in ROOT folder, NOT the dashboard subfolder
cd /d "%~dp0"
echo Working in: %CD%
echo.

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node found:
node --version
echo.

:: Check dashboard-server.js exists
if not exist dashboard-server.js (
    echo [ERROR] dashboard-server.js not found in %CD%
    echo Make sure you extracted the ZIP correctly.
    pause
    exit /b 1
)

:: Check dashboard-standalone.html exists
if not exist dashboard-standalone.html (
    echo [ERROR] dashboard-standalone.html not found in %CD%
    pause
    exit /b 1
)

echo ==========================================
echo   Dashboard: http://localhost:3000
echo   Press Ctrl+C to stop
echo ==========================================
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

node dashboard-server.js

if errorlevel 1 (
    echo.
    echo [ERROR] Server crashed. See error above.
    pause
)
