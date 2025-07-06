@echo off
echo Uploading .htaccess file to cPanel...
echo.

REM FTP upload script for .htaccess file
(
echo open your-domain.com
echo your-username
echo your-password
echo cd public_html/balloon-tracker
echo put .htaccess
echo bye
) | ftp -n

echo.
echo .htaccess file uploaded successfully!
echo Please restart your Node.js app in cPanel.
pause 