@echo off
REM Balloon Tracker Home Directory Startup Script (Windows)
REM This script runs the Node.js app from the home directory

REM Set the home directory path
set HOME_DIR=%USERPROFILE%
set BALLOON_DIR=%HOME_DIR%\balloontrack

REM Change to home directory
cd /d "%HOME_DIR%"

REM Load environment variables if .env exists
if exist "%BALLOON_DIR%\.env" (
    echo Loading environment variables from %BALLOON_DIR%\.env
    for /f "tokens=1,2 delims==" %%a in (%BALLOON_DIR%\.env) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" set %%a=%%b
    )
)

REM Set default environment variables
if "%NODE_ENV%"=="" set NODE_ENV=production
if "%PORT%"=="" set PORT=3000
if "%BASE_PATH%"=="" set BASE_PATH=/balloon-tracker

REM Check if node_modules exists in home directory
if not exist "%HOME_DIR%\node_modules" (
    echo Installing dependencies in home directory...
    npm install
)

REM Check if the balloon tracker directory exists
if not exist "%BALLOON_DIR%" (
    echo Error: Balloon tracker directory not found at %BALLOON_DIR%
    echo Please ensure the balloon tracker files are in the correct location
    pause
    exit /b 1
)

echo Starting Balloon Tracker from home directory...
echo Home directory: %HOME_DIR%
echo Balloon tracker directory: %BALLOON_DIR%
echo Port: %PORT%
echo Base path: %BASE_PATH%
echo Node environment: %NODE_ENV%

REM Start the application
node home-app.js 