console.log('=== USING FIXED API-ONLY SERVER.JS - 2025 ===');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import our modules
const aprsService = require('./services/aprsService');
const kmlService = require('./services/kmlService');
const trackingService = require('./services/trackingService');
const configService = require('./services/configService');

const app = express();
const server = http.createServer(app);

// ──────────────────────────────────────────────────
// CORS – allow live site + local dev
// ──────────────────────────────────────────────────
app.use(cors({
  origin: [
    'https://www.n4bwr.com',
    'https://n4bwr.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true
}));

// Socket.IO CORS (matches the list above)
const io = socketIo(server, {
  cors: {
    origin: [
      'https://www.n4bwr.com',
      'https://n4bwr.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ──────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────
app.use('/api/config', require('./routes/config'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/kml', require('./routes/kml'));

// Debug endpoint
app.get('/api/debug/files', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'data/config.json');
    const trackingPath = path.join(__dirname, 'data/tracking.json');
    let config = null, tracking = null;

    try { config = JSON.parse(await fs.readFile(configPath, 'utf8')); }
    catch (e) { config = { error: 'Could not read config.json', details: e.message }; }

    try { tracking = JSON.parse(await fs.readFile(trackingPath, 'utf8')); }
    catch (e) { tracking = { error: 'Could not read tracking.json', details: e.message }; }

    res.json({ config, tracking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read debug files', details: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all for unknown routes (keeps it API-only)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ──────────────────────────────────────────────────
// Socket.IO
// ──────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  const currentData = trackingService.getCurrentData();
  socket.emit('tracking-data', currentData);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start APRS polling
trackingService.startTracking(io);

// ──────────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Balloon Tracker API running on port ${PORT}`);
});

module.exports = { app, server, io };
