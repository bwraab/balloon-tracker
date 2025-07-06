@echo off
echo 🔨 Rebuilding Frontend for cPanel Subdirectory
echo ==============================================

REM Check if we're in the right directory
if not exist "client\package.json" (
    echo ❌ Error: Please run this script from the balloon-tracker root directory
    pause
    exit /b 1
)

echo 📦 Installing frontend dependencies...
cd client
call npm install --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo 🔨 Building frontend with /balloon-tracker homepage...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
cd ..

echo ✅ Frontend rebuilt successfully!
echo.
echo 📁 Files to upload to server:
echo    - client/build/ (entire folder)
echo    - app.js (updated version)
echo    - .htaccess (updated version)
echo.
echo 🔧 Don't forget to:
echo    1. Set BASE_PATH=/balloon-tracker in cPanel environment variables
echo    2. Restart your Node.js app
echo.
pause 