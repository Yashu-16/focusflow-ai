@echo off
title AI Efficiency - Backend
color 0A
echo.
echo ==========================================
echo   AI Life Efficiency - Backend Server
echo ==========================================
echo.

cd /d "%~dp0backend"
echo Working in: %CD%
echo.

:: Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found.
    echo Install Python 3.10+ from https://python.org
    echo Make sure to check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo Found: %%i

:: Write .env safely
if not exist .env (
    echo Writing .env...
    echo DATABASE_URL=sqlite:///./ai_efficiency.db>.env
    echo ANTHROPIC_API_KEY=your_key_here>>.env
    echo OPENAI_API_KEY=your_key_here>>.env
    echo SECRET_KEY=changeme-local-dev>>.env
    echo .env created.
)

:: Create venv
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Could not create venv.
        pause
        exit /b 1
    )
    echo Virtual environment created.
)

:: Activate
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Could not activate venv. Delete the venv folder and try again.
    pause
    exit /b 1
)
echo Virtual environment activated.

:: Upgrade pip silently
python -m pip install --upgrade pip -q

:: Install packages
echo Installing packages...
pip install fastapi "uvicorn[standard]" sqlalchemy "anthropic>=0.7" "openai>=1.0" python-dotenv pydantic httpx -q
if errorlevel 1 (
    echo ERROR: Package install failed. Check your internet connection.
    pause
    exit /b 1
)
echo Packages ready.

echo.
echo ==========================================
echo  Backend: http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  CTRL+C to stop
echo ==========================================
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
if errorlevel 1 (
    echo.
    echo ERROR: Server crashed. See error above.
    pause
)
