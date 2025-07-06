const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs').promises;

// Import our modules
const aprsService = require('./services/aprsService');
const kmlService = require('./services/kmlService');
const trackingService = require('./services/trackingService');
const configService = require('./services/configService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://n4bwr.com',
    'https://www.n4bwr.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/kml', require('./routes/kml'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API-only server - no frontend serving
app.get('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current tracking data to new client
  const currentData = trackingService.getCurrentData();
  socket.emit('tracking-data', currentData);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start APRS tracking service
trackingService.startTracking(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Balloon Tracker server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view the application`);
});

module.exports = { app, server, io }; 