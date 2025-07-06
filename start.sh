#!/bin/bash

echo "Starting Balloon Tracker..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found"
    echo "Please create a .env file with your APRS API key"
    echo "See env.example for reference"
    echo
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install backend dependencies"
        exit 1
    fi
fi

# Install frontend dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install frontend dependencies"
        exit 1
    fi
    cd ..
fi

# Build frontend if needed
if [ ! -d "client/build" ]; then
    echo "Building frontend..."
    cd client
    npm run build
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build frontend"
        exit 1
    fi
    cd ..
fi

echo
echo "Starting Balloon Tracker server..."
echo "The application will be available at http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo

npm start 