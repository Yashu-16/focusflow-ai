@echo off
title Troubleshooter
color 0F
echo.
echo ==========================================
echo   AI Efficiency - Troubleshooter
echo ==========================================
echo.

echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Python NOT found - install from https://python.org
    echo          During install check "Add Python to PATH"
) else (
    echo   [OK]   Python:
    python --version
)

echo.
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Node.js NOT found - install from https://nodejs.org
) else (
    echo   [OK]   Node:
    node --version
)

echo.
echo Checking port 8000 (Backend)...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo   [DOWN] Backend is NOT running - run start-backend.bat
) else (
    echo   [OK]   Backend is running on port 8000
)

echo.
echo Checking port 3000 (Dashboard)...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo   [DOWN] Dashboard is NOT running - run start-dashboard.bat
) else (
    echo   [OK]   Dashboard is running on port 3000
)

echo.
echo Checking backend .env file...
if exist "%~dp0backend\.env" (
    echo   [OK]   .env file exists
    findstr "sqlite" "%~dp0backend\.env" >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] .env may not use SQLite - check DATABASE_URL line
    ) else (
        echo   [OK]   Using SQLite database
    )
) else (
    echo   [WARN] .env missing - will be created when you run start-backend.bat
)

echo.
echo ==========================================
echo.
echo If backend shows [DOWN]: double-click start-backend.bat
echo If dashboard shows [DOWN]: double-click start-dashboard.bat
echo.
echo After both are running, visit: http://localhost:3000
echo.
pause
