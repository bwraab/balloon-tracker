#!/bin/bash

# Balloon Tracker Home Directory Startup Script
# This script runs the Node.js app from the home directory

# Set the home directory path
HOME_DIR="$HOME"
BALLOON_DIR="$HOME_DIR/balloontrack"

# Change to home directory
cd "$HOME_DIR"

# Load environment variables if .env exists
if [ -f "$BALLOON_DIR/.env" ]; then
    echo "Loading environment variables from $BALLOON_DIR/.env"
    export $(cat "$BALLOON_DIR/.env" | grep -v '^#' | xargs)
fi

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export BASE_PATH=${BASE_PATH:-/balloon-tracker}

# Check if node_modules exists in home directory
if [ ! -d "$HOME_DIR/node_modules" ]; then
    echo "Installing dependencies in home directory..."
    npm install
fi

# Check if the balloon tracker directory exists
if [ ! -d "$BALLOON_DIR" ]; then
    echo "Error: Balloon tracker directory not found at $BALLOON_DIR"
    echo "Please ensure the balloon tracker files are in the correct location"
    exit 1
fi

echo "Starting Balloon Tracker from home directory..."
echo "Home directory: $HOME_DIR"
echo "Balloon tracker directory: $BALLOON_DIR"
echo "Port: $PORT"
echo "Base path: $BASE_PATH"
echo "Node environment: $NODE_ENV"

# Start the application
node home-app.js 