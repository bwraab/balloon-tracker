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
// CORS – allow your live site + local dev
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

// Socket.IO CORS (must match the above)
const io = socketIo(server, {
  cors: {
    origin: [
      'https://www.n4bwr.com',
      'https://n4bwr
