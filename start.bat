@echo off
echo Starting Balloon Tracker...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found
    echo Please create a .env file with your APRS API key
    echo See env.example for reference
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

REM Install frontend dependencies if needed
if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    cd client
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Build frontend if needed
if not exist "client\build" (
    echo Building frontend...
    cd client
    npm run build
    if %errorlevel% neq 0 (
        echo Error: Failed to build frontend
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo Starting Balloon Tracker server...
echo The application will be available at http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

npm start 