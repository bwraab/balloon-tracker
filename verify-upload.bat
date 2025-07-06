@echo off
echo 🔍 Balloon Tracker - Upload Verification Checklist
echo ================================================
echo.
echo This will show you exactly what files should be on your cPanel server.
echo.
echo 📁 REQUIRED FILES AND FOLDERS:
echo.

echo ✅ ROOT FILES:
echo    - app.js
echo    - package.json
echo    - .htaccess
echo    - env.example
echo    - .gitignore
echo    - DEPLOYMENT-INSTRUCTIONS.txt
echo.

echo ✅ FOLDERS:
echo    - services/
echo      - aprsService.js
echo      - kmlService.js
echo      - trackingService.js
echo      - configService.js
echo.

echo    - routes/
echo      - config.js
echo      - tracking.js
echo      - kml.js
echo.

echo    - client/
echo      - build/
echo        - static/
echo        - index.html
echo        - asset-manifest.json
echo.

echo 📋 UPLOAD CHECKLIST:
echo.
echo 1. Did you create the main folder 'balloon-tracker' in public_html?
echo 2. Did you upload app.js to the root of balloon-tracker?
echo 3. Did you upload package.json to the root of balloon-tracker?
echo 4. Did you create the 'services' folder and upload all 4 .js files?
echo 5. Did you create the 'routes' folder and upload all 3 .js files?
echo 6. Did you create the 'client' folder?
echo 7. Did you create the 'client/build' folder?
echo 8. Did you upload all files from client/build/ (including static folder)?
echo 9. Did you upload .htaccess, env.example, and .gitignore?
echo 10. Did you upload DEPLOYMENT-INSTRUCTIONS.txt?
echo.

echo 🔍 TO VERIFY ON CPANEL:
echo.
echo 1. Go to cPanel → File Manager
echo 2. Navigate to public_html/balloon-tracker/
echo 3. Check that you see these files in the root:
echo    - app.js
echo    - package.json
echo    - .htaccess
echo    - env.example
echo    - .gitignore
echo    - DEPLOYMENT-INSTRUCTIONS.txt
echo.
echo 4. Check that you have these folders:
echo    - services/ (with 4 .js files)
echo    - routes/ (with 3 .js files)
echo    - client/build/ (with static folder and other files)
echo.

echo 🚨 COMMON MISTAKES:
echo - Forgetting to upload the 'static' folder inside client/build/
echo - Not uploading .htaccess file
echo - Missing package.json file
echo - Not creating all subfolders properly
echo.

echo 📞 NEED HELP?
echo If you're missing files, you can:
echo 1. Download the balloon-tracker-deploy folder again
echo 2. Use the checklist above to verify each file
echo 3. Upload any missing files individually
echo.

pause 