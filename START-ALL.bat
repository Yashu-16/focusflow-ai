@echo off
title AI Life Efficiency - Launcher
color 0E
echo.
echo ==========================================
echo   AI Life Efficiency - Full Launcher
echo ==========================================
echo.

:: Check Python exists before launching
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.9+ from:
    echo   https://www.python.org/downloads/
    echo.
    echo IMPORTANT: During install, check the box that says:
    echo   "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

:: Check Node exists before launching
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js 18+ from:
    echo   https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.
echo.
echo Starting Backend server (port 8000)...
start "AI Backend" cmd /k "cd /d %~dp0 && start-backend.bat"

echo Waiting 4 seconds before starting dashboard...
timeout /t 4 /nobreak >nul

echo Starting Dashboard (port 3000)...
start "AI Dashboard" cmd /k "cd /d %~dp0 && start-dashboard.bat"

echo.
echo Both servers are starting in separate windows.
echo.
echo   Backend API:  http://localhost:8000
echo   Dashboard:    http://localhost:3000
echo   API Docs:     http://localhost:8000/docs
echo.
echo Wait about 30 seconds for first-time setup, then visit:
echo   http://localhost:3000
echo.
pause
