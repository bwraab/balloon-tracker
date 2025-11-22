const fs = require('fs').promises;
const path = require('path');
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
// ←←← ADD THESE 4 LINES EXACTLY HERE
const cors = require('cors');
app.use(cors({
  origin: 'https://www.n4bwr.com',
  credentials: true
}));
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

// Enable CORS for frontend domain
app.use(cors({
  origin: 'https://n4bwr.com',
  credentials: true
}));

// API Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/kml', require('./routes/kml'));

// Place the debug endpoint here, before any catch-all routes
app.get('/api/debug/files', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'data/config.json');
    const trackingPath = path.join(__dirname, 'data/tracking.json');
    let config = null, tracking = null;

    try {
      config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    } catch (e) {
      config = { error: 'Could not read config.json', details: e.message };
    }

    try {
      tracking = JSON.parse(await fs.readFile(trackingPath, 'utf8'));
    } catch (e) {
      tracking = { error: 'Could not read tracking.json', details: e.message };
    }

    res.json({ config, tracking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read debug files', details: err.message });
  }
});

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
