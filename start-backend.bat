@echo off
title AI Efficiency - Backend Server
color 0A
echo.
echo ==========================================
echo   AI Life Efficiency - Backend Server
echo ==========================================
echo.

cd /d "%~dp0backend"
echo [INFO] Working directory: %CD%
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install from https://python.org
    pause & exit /b 1
)
echo [OK] Python found:
python --version
echo.

if not exist .env (
    echo [INFO] Creating .env file with SQLite...
    echo DATABASE_URL=sqlite:///./ai_efficiency.db > .env
    echo ANTHROPIC_API_KEY=your_anthropic_api_key_here >> .env
    echo OPENAI_API_KEY=your_openai_api_key_here >> .env
    echo SECRET_KEY=local-dev-secret-key >> .env
    echo [OK] .env created.
    echo.
    echo *** OPTIONAL: Edit backend\.env and add your real API key ***
    echo     Anthropic: https://console.anthropic.com
    echo     OpenAI:    https://platform.openai.com
    echo.
)

if not exist venv (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 ( echo [ERROR] venv creation failed. & pause & exit /b 1 )
    echo [OK] Virtual environment created.
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Installing Python packages...
pip install fastapi "uvicorn[standard]" sqlalchemy anthropic openai python-dotenv pydantic httpx --quiet
if errorlevel 1 ( echo [ERROR] Package install failed. & pause & exit /b 1 )
echo [OK] Packages ready.

echo.
echo ==========================================
echo   Backend running: http://localhost:8000
echo   API docs:        http://localhost:8000/docs
echo   Press Ctrl+C to stop
echo ==========================================
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
