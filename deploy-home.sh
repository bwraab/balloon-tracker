#!/bin/bash

# Deploy Balloon Tracker to Home Directory
# This script sets up the Node.js app to run from the home directory

echo "========================================"
echo "Balloon Tracker Home Directory Deployment"
echo "========================================"

# Set paths
HOME_DIR="$HOME"
BALLOON_DIR="$HOME_DIR/balloontrack"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Home directory: $HOME_DIR"
echo "Balloon tracker directory: $BALLOON_DIR"
echo "Current directory: $CURRENT_DIR"

# Create balloon tracker directory in home if it doesn't exist
if [ ! -d "$BALLOON_DIR" ]; then
    echo "Creating balloon tracker directory in home..."
    mkdir -p "$BALLOON_DIR"
fi

# Copy necessary files to home directory
echo "Copying files to home directory..."

# Copy the home app files
cp "$CURRENT_DIR/home-app.js" "$HOME_DIR/home-app.js"
cp "$CURRENT_DIR/home-package.json" "$HOME_DIR/package.json"

# Copy the entire balloon tracker directory structure
echo "Copying balloon tracker files..."
cp -r "$CURRENT_DIR/services" "$BALLOON_DIR/"
cp -r "$CURRENT_DIR/routes" "$BALLOON_DIR/"
cp -r "$CURRENT_DIR/client" "$BALLOON_DIR/"

# Copy configuration files
if [ -f "$CURRENT_DIR/.env" ]; then
    cp "$CURRENT_DIR/.env" "$BALLOON_DIR/.env"
    echo "Copied .env file"
fi

# Copy the startup scripts
cp "$CURRENT_DIR/start-home.bat" "$HOME_DIR/start-home.bat"
cp "$CURRENT_DIR/start-home.sh" "$HOME_DIR/start-home.sh"

# Change to home directory
cd "$HOME_DIR"

# Install dependencies in home directory
echo "Installing dependencies in home directory..."
npm install

# Make the shell script executable
chmod +x "$HOME_DIR/start-home.sh"

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "To start the app from home directory:"
echo "1. Open a terminal"
echo "2. Navigate to: $HOME_DIR"
echo "3. Run: ./start-home.sh"
echo ""
echo "The app will be available at: http://yourdomain.com/balloon-tracker"
echo ""
echo "To update the .htaccess file in your web directory:"
echo "Copy .htaccess-home to .htaccess in your web directory"
echo "" 