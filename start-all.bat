@echo off
echo ================================================
echo Road-Aware ML Integration - Complete Startup
echo ================================================
echo.

REM Check if ML API is running
echo [1/3] Checking ML API on port 5000...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ML API is not running!
    echo [!] Please start in separate terminal:
    echo     cd C:\Users\nikhi\Projects\potholeDetection
    echo     python start_api_simple.py
    echo.
    pause
    exit /b 1
) else (
    echo [OK] ML API is running
)

echo.
echo [2/3] Starting Backend Server on port 5001...
start "Road-Aware Backend" cmd /k "cd /d C:\Users\nikhi\Projects\Road-Aware && node backend/server.js"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend on port 3000...
start "Road-Aware Frontend" cmd /k "cd /d C:\Users\nikhi\Projects\Road-Aware && npm run dev"

echo.
echo ================================================
echo All services started!
echo ================================================
echo.
echo Services:
echo   - ML API:     http://localhost:5000
echo   - Backend:    http://localhost:5001
echo   - Frontend:   http://localhost:3000
echo.
echo Check each terminal window for status.
echo.
echo Press any key to close this window...
pause >nul
