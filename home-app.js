const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import our modules - adjust paths for home directory
const aprsService = require('./balloontrack/services/aprsService');
const kmlService = require('./balloontrack/services/kmlService');
const trackingService = require('./balloontrack/services/trackingService');
const configService = require('./balloontrack/services/configService');

const app = express();

// Get the base path from environment or default to /balloon-tracker
const BASE_PATH = process.env.BASE_PATH || '/balloon-tracker';

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

// Serve static files from the React build directory in the subdirectory
app.use(`${BASE_PATH}/static`, express.static(path.join(__dirname, 'balloontrack/client/build/static')));
app.use(`${BASE_PATH}/manifest.json`, express.static(path.join(__dirname, 'balloontrack/client/build/manifest.json')));
app.use(`${BASE_PATH}/favicon.ico`, express.static(path.join(__dirname, 'balloontrack/client/build/favicon.ico')));
app.use(`${BASE_PATH}/logo192.png`, express.static(path.join(__dirname, 'balloontrack/client/build/logo192.png')));
app.use(`${BASE_PATH}/logo512.png`, express.static(path.join(__dirname, 'balloontrack/client/build/logo512.png')));

// API Routes
app.use(`${BASE_PATH}/api/config`, require('./balloontrack/routes/config'));
app.use(`${BASE_PATH}/api/tracking`, require('./balloontrack/routes/tracking'));
app.use(`${BASE_PATH}/api/kml`, require('./balloontrack/routes/kml'));

// Health check endpoint
app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    basePath: BASE_PATH,
    workingDir: __dirname
  });
});

// Serve React app for all other routes under the base path
app.get(`${BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(__dirname, 'balloontrack/client/build', 'index.html'));
});

// Redirect root to the base path
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

// Start tracking service (without Socket.IO for cPanel)
trackingService.startTrackingForCpanel();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Balloon Tracker running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base path: ${BASE_PATH}`);
  console.log(`Working directory: ${__dirname}`);
  console.log(`APRS API Key: ${process.env.APRS_API_KEY ? 'Configured' : 'Missing'}`);
});

module.exports = app; 