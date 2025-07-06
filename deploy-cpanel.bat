@echo off
echo 🚀 Balloon Tracker - cPanel Deployment Script
echo ==============================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the balloon-tracker root directory
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install and build frontend
echo 🔨 Building frontend...
cd client
call npm install --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
cd ..

REM Create deployment package
echo 📦 Creating deployment package...
set DEPLOY_DIR=balloon-tracker-deploy
if exist %DEPLOY_DIR% rmdir /s /q %DEPLOY_DIR%
mkdir %DEPLOY_DIR%

REM Copy necessary files
xcopy /e /i services %DEPLOY_DIR%\services
xcopy /e /i routes %DEPLOY_DIR%\routes
xcopy /e /i client\build %DEPLOY_DIR%\client\build
copy app.js %DEPLOY_DIR%\
copy package-cpanel.json %DEPLOY_DIR%\package.json
copy env.example %DEPLOY_DIR%\
copy .gitignore %DEPLOY_DIR%\

REM Create .htaccess for cPanel
echo RewriteEngine On > %DEPLOY_DIR%\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> %DEPLOY_DIR%\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> %DEPLOY_DIR%\.htaccess
echo RewriteRule ^(.*)$ /index.html [QSA,L] >> %DEPLOY_DIR%\.htaccess
echo. >> %DEPLOY_DIR%\.htaccess
echo # Security headers >> %DEPLOY_DIR%\.htaccess
echo Header always set X-Content-Type-Options nosniff >> %DEPLOY_DIR%\.htaccess
echo Header always set X-Frame-Options DENY >> %DEPLOY_DIR%\.htaccess
echo Header always set X-XSS-Protection "1; mode=block" >> %DEPLOY_DIR%\.htaccess

REM Create deployment instructions
echo BALLOON TRACKER - cPanel Deployment Instructions > %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo =============================================== >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 1. UPLOAD FILES: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Upload all files in this folder to your cPanel File Manager >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Extract in your desired directory (e.g., /public_html/balloon-tracker/) >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 2. SET UP NODE.JS APP IN CPANEL: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Go to cPanel → Software → Setup Node.js App >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Create New Application: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Node.js version: 16.x or higher >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Application mode: Production >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Application root: /home/username/public_html/balloon-tracker >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Application URL: yourdomain.com/balloon-tracker >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Application startup file: app.js >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * Passenger port: 3000 >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 3. SET ENVIRONMENT VARIABLES: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - In the Node.js app settings, add: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * APRS_API_KEY: your_aprs_api_key_here >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * NODE_ENV: production >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo      * PORT: 3000 >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 4. INSTALL DEPENDENCIES: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Go to cPanel → Advanced → Terminal >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Navigate to your app directory >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Run: npm install --production >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 5. START THE APPLICATION: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - In the Node.js app settings, click "Start" >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 6. ACCESS YOUR APP: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Go to: https://yourdomain.com/balloon-tracker >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo 7. CONFIGURE: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Enter your balloon callsign >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Add chaser callsigns >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo    - Upload KML prediction file >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo TROUBLESHOOTING: >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo - Check cPanel error logs if the app won't start >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo - Verify Node.js version is 16+ >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo - Ensure APRS_API_KEY is set correctly >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo - Check file permissions (644 for files, 755 for directories) >> %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt

echo.
echo ✅ Deployment package created successfully!
echo.
echo 📁 Files created:
echo    - %DEPLOY_DIR%\ (deployment directory)
echo.
echo 📋 Next steps:
echo    1. Upload the %DEPLOY_DIR% folder to cPanel File Manager
echo    2. Extract the files in your desired directory
echo    3. Follow the instructions in DEPLOYMENT-INSTRUCTIONS.txt
echo.
echo 🔑 Don't forget to:
echo    - Get your APRS API key from https://aprs.fi/
echo    - Set up the Node.js app in cPanel
echo    - Configure environment variables
echo.
echo 🎈 Happy balloon tracking!
pause 