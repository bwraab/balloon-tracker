#!/bin/bash

echo "🚀 Balloon Tracker - cPanel Deployment Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the balloon-tracker root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Error: Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install and build frontend
echo "🔨 Building frontend..."
cd client
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="balloon-tracker-deploy"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# Copy necessary files
cp -r services $DEPLOY_DIR/
cp -r routes $DEPLOY_DIR/
cp -r client/build $DEPLOY_DIR/client/
cp app.js $DEPLOY_DIR/
cp package-cpanel.json $DEPLOY_DIR/package.json
cp env.example $DEPLOY_DIR/
cp .gitignore $DEPLOY_DIR/

# Create .htaccess for cPanel
cat > $DEPLOY_DIR/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

# Create deployment instructions
cat > $DEPLOY_DIR/DEPLOYMENT-INSTRUCTIONS.txt << 'EOF'
BALLOON TRACKER - cPanel Deployment Instructions
===============================================

1. UPLOAD FILES:
   - Upload all files in this folder to your cPanel File Manager
   - Extract in your desired directory (e.g., /public_html/balloon-tracker/)

2. SET UP NODE.JS APP IN CPANEL:
   - Go to cPanel → Software → Setup Node.js App
   - Create New Application:
     * Node.js version: 16.x or higher
     * Application mode: Production
     * Application root: /home/username/public_html/balloon-tracker
     * Application URL: yourdomain.com/balloon-tracker
     * Application startup file: app.js
     * Passenger port: 3000

3. SET ENVIRONMENT VARIABLES:
   - In the Node.js app settings, add:
     * APRS_API_KEY: your_aprs_api_key_here
     * NODE_ENV: production
     * PORT: 3000

4. INSTALL DEPENDENCIES:
   - Go to cPanel → Advanced → Terminal
   - Navigate to your app directory
   - Run: npm install --production

5. START THE APPLICATION:
   - In the Node.js app settings, click "Start"

6. ACCESS YOUR APP:
   - Go to: https://yourdomain.com/balloon-tracker

7. CONFIGURE:
   - Enter your balloon callsign
   - Add chaser callsigns
   - Upload KML prediction file

TROUBLESHOOTING:
- Check cPanel error logs if the app won't start
- Verify Node.js version is 16+ 
- Ensure APRS_API_KEY is set correctly
- Check file permissions (644 for files, 755 for directories)
EOF

# Create ZIP file
echo "📦 Creating ZIP file..."
zip -r balloon-tracker-cpanel.zip $DEPLOY_DIR/

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Files created:"
echo "   - $DEPLOY_DIR/ (deployment directory)"
echo "   - balloon-tracker-cpanel.zip (upload to cPanel)"
echo ""
echo "📋 Next steps:"
echo "   1. Upload balloon-tracker-cpanel.zip to cPanel File Manager"
echo "   2. Extract the ZIP file"
echo "   3. Follow the instructions in DEPLOYMENT-INSTRUCTIONS.txt"
echo ""
echo "🔑 Don't forget to:"
echo "   - Get your APRS API key from https://aprs.fi/"
echo "   - Set up the Node.js app in cPanel"
echo "   - Configure environment variables"
echo ""
echo "🎈 Happy balloon tracking!" 