const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import our modules
const aprsService = require('./services/aprsService');
const kmlService = require('./services/kmlService');
const trackingService = require('./services/trackingService');
const configService = require('./services/configService');

const app = express();

// Get the base path from environment or default to root
const BASE_PATH = process.env.BASE_PATH || '';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
      connectSrc: ["'self'", "https://api.aprs.fi"],
      fontSrc: ["'self'", "https://unpkg.com"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React build directory
app.use(`${BASE_PATH}/static`, express.static(path.join(__dirname, 'client/build/static')));
app.use(`${BASE_PATH}/manifest.json`, express.static(path.join(__dirname, 'client/build/manifest.json')));
app.use(`${BASE_PATH}/favicon.ico`, express.static(path.join(__dirname, 'client/build/favicon.ico')));
app.use(`${BASE_PATH}/logo192.png`, express.static(path.join(__dirname, 'client/build/logo192.png')));
app.use(`${BASE_PATH}/logo512.png`, express.static(path.join(__dirname, 'client/build/logo512.png')));

// API Routes
app.use(`${BASE_PATH}/api/config`, require('./routes/config'));
app.use(`${BASE_PATH}/api/tracking`, require('./routes/tracking'));
app.use(`${BASE_PATH}/api/kml`, require('./routes/kml'));

// Health check endpoint
app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve React app for all other routes
app.get(`${BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Also serve root path for compatibility
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start tracking service (without Socket.IO for cPanel)
trackingService.startTrackingForCpanel();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Balloon Tracker running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base path: ${BASE_PATH || '/'}`);
  console.log(`APRS API Key: ${process.env.APRS_API_KEY ? 'Configured' : 'Missing'}`);
});

module.exports = app; 