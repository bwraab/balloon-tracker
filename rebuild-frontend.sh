#!/bin/bash

echo "🔨 Rebuilding Frontend for cPanel Subdirectory"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the balloon-tracker root directory"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd client
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "🔨 Building frontend with /balloon-tracker homepage..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi
cd ..

echo "✅ Frontend rebuilt successfully!"
echo ""
echo "📁 Files to upload to server:"
echo "   - client/build/ (entire folder)"
echo "   - app.js (updated version)"
echo "   - .htaccess (updated version)"
echo ""
echo "🔧 Don't forget to:"
echo "   1. Set BASE_PATH=/balloon-tracker in cPanel environment variables"
echo "   2. Restart your Node.js app"
echo "" 