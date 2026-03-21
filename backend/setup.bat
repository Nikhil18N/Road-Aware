@echo off
REM Supabase Setup - Quick Commands for Windows
REM Run this after setting up Supabase

echo ========================================
echo Road-Aware Backend - Supabase Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo ✓ .env file created!
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env and add your Supabase credentials:
    echo    - SUPABASE_URL
    echo    - SUPABASE_ANON_KEY
    echo    - SUPABASE_SERVICE_ROLE_KEY
    echo.
    echo Get these from: Supabase Dashboard → Settings → API
    echo.
    pause
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Check if installation was successful
if %errorlevel% neq 0 (
    echo.
    echo ❌ npm install failed. Please check your Node.js installation.
    pause
    exit /b 1
)

REM Start the server
echo.
echo Starting the server...
echo.
call npm run dev
