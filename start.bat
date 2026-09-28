@echo off
TITLE BlockMind AI - Offline Blockchain Assistant
echo ========================================================
echo        BlockMind AI - Offline Blockchain Assistant
echo ========================================================
echo.
echo Checking Python and Node environments...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo.
echo [1/3] Setting up Backend dependencies...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo [2/3] Setting up Frontend dependencies...
cd frontend
call npm.cmd install
cd ..

echo.
echo ========================================================
echo Starting BlockMind AI Services...
echo Backend API : http://localhost:8000
echo Frontend UI : http://localhost:5173
echo ========================================================
echo.

start "BlockMind AI Backend" cmd /k "cd backend && call venv\Scripts\activate && python app.py"
start "BlockMind AI Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo BlockMind AI is launching in your default browser...
timeout /t 3 >nul
start http://localhost:5173
pause
