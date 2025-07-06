# Balloon Tracker - Home Directory Setup

This setup allows the Node.js balloon tracker app to run from your home directory, which is typically allowed in shared hosting environments, while keeping the web files in the public_html directory.

## Overview

The problem with shared hosting is that Node.js apps are often restricted from running in certain directories. By moving the Node.js app to the home directory, we can work around these restrictions while still serving the web application through the normal web directory.

## File Structure

```
Your Home Directory (~/)
├── home-app.js              # Main Node.js app (runs from home)
├── package.json             # Dependencies for home directory
├── start-home.bat          # Windows startup script
├── start-home.sh           # Linux/Mac startup script
└── balloontrack/           # Balloon tracker files
    ├── services/           # Backend services
    ├── routes/             # API routes
    ├── client/             # React frontend
    └── .env                # Environment variables

Public HTML Directory (public_html/balloon-tracker/)
├── .htaccess               # Proxies requests to home directory
└── (static files served by Node.js)
```

## Deployment Steps

### 1. Run the Deployment Script

**Windows:**
```bash
deploy-home.bat
```

**Linux/Mac:**
```bash
chmod +x deploy-home.sh
./deploy-home.sh
```

This script will:
- Copy the Node.js app files to your home directory
- Copy the balloon tracker modules to `~/balloontrack/`
- Install dependencies in the home directory
- Set up startup scripts

### 2. Update Your Web Directory

Copy the new .htaccess file to your web directory:

```bash
cp .htaccess-home public_html/balloon-tracker/.htaccess
```

### 3. Start the Node.js App

Navigate to your home directory and start the app:

**Windows:**
```bash
cd %USERPROFILE%
start-home.bat
```

**Linux/Mac:**
```bash
cd ~
./start-home.sh
```

## Configuration

### Environment Variables

The app will look for a `.env` file in the `~/balloontrack/` directory:

```env
NODE_ENV=production
PORT=3000
BASE_PATH=/balloon-tracker
APRS_API_KEY=your_aprs_api_key_here
```

### Base Path

The app is configured to run under the `/balloon-tracker` subdirectory. If you need to change this:

1. Update the `BASE_PATH` environment variable
2. Update the `homepage` in `client/package.json`
3. Rebuild the React frontend

## How It Works

1. **Web Requests**: When someone visits `http://yourdomain.com/balloon-tracker`, the `.htaccess` file proxies the request to `http://localhost:3000/balloon-tracker`

2. **Node.js App**: The Node.js app running from the home directory receives the request and serves the appropriate content

3. **Static Files**: The Node.js app serves static files from `~/balloontrack/client/build/`

4. **API Routes**: API requests are handled by the Node.js app and routed to the appropriate service modules

## Troubleshooting

### App Won't Start

1. **Check permissions**: Ensure the home directory files are readable
2. **Check Node.js version**: Make sure you're using Node.js 22 (as shown in cPanel)
3. **Check dependencies**: Run `npm install` in the home directory
4. **Check environment**: Ensure the `.env` file exists in `~/balloontrack/`

### 404 Errors

1. **Check .htaccess**: Ensure the `.htaccess` file is in the correct web directory
2. **Check Node.js process**: Verify the Node.js app is running on port 3000
3. **Check base path**: Ensure the `BASE_PATH` environment variable is set correctly

### 503 Errors

1. **Check Node.js process**: The app might not be running
2. **Check port**: Ensure port 3000 is available
3. **Check hosting restrictions**: Some hosts block certain ports

### Environment Variables Not Loading

1. **Check .env file**: Ensure it exists in `~/balloontrack/.env`
2. **Check file format**: No spaces around `=` signs
3. **Check startup script**: The script should load the .env file

## Manual Startup

If the startup scripts don't work, you can start the app manually:

```bash
cd ~
export NODE_ENV=production
export PORT=3000
export BASE_PATH=/balloon-tracker
node home-app.js
```

## Stopping the App

To stop the Node.js app, use `Ctrl+C` in the terminal where it's running, or find the process and kill it:

```bash
# Find the process
ps aux | grep node

# Kill the process (replace PID with actual process ID)
kill PID
```

## Updating the App

To update the app:

1. Update the files in your current directory
2. Run the deployment script again
3. Restart the Node.js app

## Security Notes

- The Node.js app runs on localhost only
- All external requests go through the web server
- Environment variables are loaded from the home directory
- Static files are served by the Node.js app, not directly by the web server

## Support

If you encounter issues:

1. Check the Node.js app logs for error messages
2. Verify all files are in the correct locations
3. Test the app manually before deploying
4. Contact your hosting provider if Node.js processes aren't allowed 