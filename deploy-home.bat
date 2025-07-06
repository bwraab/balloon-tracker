@echo off
REM Deploy Balloon Tracker to Home Directory
REM This script sets up the Node.js app to run from the home directory

echo ========================================
echo Balloon Tracker Home Directory Deployment
echo ========================================

REM Set paths
set HOME_DIR=%USERPROFILE%
set BALLOON_DIR=%HOME_DIR%\balloontrack
set CURRENT_DIR=%~dp0

echo Home directory: %HOME_DIR%
echo Balloon tracker directory: %BALLOON_DIR%
echo Current directory: %CURRENT_DIR%

REM Create balloon tracker directory in home if it doesn't exist
if not exist "%BALLOON_DIR%" (
    echo Creating balloon tracker directory in home...
    mkdir "%BALLOON_DIR%"
)

REM Copy necessary files to home directory
echo Copying files to home directory...

REM Copy the home app files
copy "%CURRENT_DIR%home-app.js" "%HOME_DIR%\home-app.js"
copy "%CURRENT_DIR%home-package.json" "%HOME_DIR%\package.json"

REM Copy the entire balloon tracker directory structure
echo Copying balloon tracker files...
xcopy "%CURRENT_DIR%services" "%BALLOON_DIR%\services\" /E /I /Y
xcopy "%CURRENT_DIR%routes" "%BALLOON_DIR%\routes\" /E /I /Y
xcopy "%CURRENT_DIR%client" "%BALLOON_DIR%\client\" /E /I /Y

REM Copy configuration files
if exist "%CURRENT_DIR%.env" (
    copy "%CURRENT_DIR%.env" "%BALLOON_DIR%\.env"
    echo Copied .env file
)

REM Copy the startup scripts
copy "%CURRENT_DIR%start-home.bat" "%HOME_DIR%\start-home.bat"
copy "%CURRENT_DIR%start-home.sh" "%HOME_DIR%\start-home.sh"

REM Change to home directory
cd /d "%HOME_DIR%"

REM Install dependencies in home directory
echo Installing dependencies in home directory...
npm install

REM Make the shell script executable (if on Unix-like system)
if exist "start-home.sh" (
    echo Making shell script executable...
    chmod +x start-home.sh
)

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo To start the app from home directory:
echo 1. Open a terminal/command prompt
echo 2. Navigate to: %HOME_DIR%
echo 3. Run: start-home.bat (Windows) or ./start-home.sh (Linux/Mac)
echo.
echo The app will be available at: http://yourdomain.com/balloon-tracker
echo.
echo To update the .htaccess file in your web directory:
echo Copy .htaccess-home to .htaccess in your web directory
echo.
pause 