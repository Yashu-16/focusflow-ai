@echo off
title AI Efficiency - Dashboard
color 0B
echo.
echo ==========================================
echo   AI Life Efficiency - Dashboard
echo ==========================================
echo.

cd /d "%~dp0dashboard"
echo [INFO] Working directory: %CD%
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node found:
node --version

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Reinstall Node.js.
    pause & exit /b 1
)
echo [OK] npm found:
npm --version
echo.

if not exist node_modules (
    echo [INFO] Installing packages - this takes 2-3 minutes first time...
    npm install
    if errorlevel 1 ( echo [ERROR] npm install failed. & pause & exit /b 1 )
    echo [OK] Packages installed.
    echo.
)

echo ==========================================
echo   Dashboard running: http://localhost:3000
echo   Press Ctrl+C to stop
echo ==========================================
echo.

npm run dev

pause
