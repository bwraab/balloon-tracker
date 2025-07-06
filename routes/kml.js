const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const kmlService = require('../services/kmlService');
const trackingService = require('../services/trackingService');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `prediction-${timestamp}.kml`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.google-earth.kml+xml' || 
        file.originalname.toLowerCase().endsWith('.kml')) {
      cb(null, true);
    } else {
      cb(new Error('Only KML files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload KML prediction file
router.post('/upload', upload.single('kmlFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const predictionData = await kmlService.parseKMLFile(filePath);
    
    // Set the prediction data in the tracking service
    trackingService.setPrediction(predictionData);
    
    res.json({
      message: 'KML file uploaded and processed successfully',
      prediction: predictionData
    });
  } catch (error) {
    console.error('Error uploading KML file:', error);
    res.status(500).json({ error: 'Failed to process KML file' });
  }
});

// Upload KML content directly
router.post('/content', async (req, res) => {
  try {
    const { kmlContent } = req.body;
    
    if (!kmlContent) {
      return res.status(400).json({ error: 'KML content is required' });
    }

    const predictionData = await kmlService.parseKMLContent(kmlContent);
    
    // Set the prediction data in the tracking service
    trackingService.setPrediction(predictionData);
    
    res.json({
      message: 'KML content processed successfully',
      prediction: predictionData
    });
  } catch (error) {
    console.error('Error processing KML content:', error);
    res.status(500).json({ error: 'Failed to process KML content' });
  }
});

// Get current prediction data
router.get('/', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json(data.prediction);
  } catch (error) {
    console.error('Error getting prediction data:', error);
    res.status(500).json({ error: 'Failed to get prediction data' });
  }
});

// Calculate prediction metrics
router.post('/calculate-metrics', async (req, res) => {
  try {
    const { burstPoint, landingPoint } = req.body;
    
    if (!burstPoint || !landingPoint) {
      return res.status(400).json({ error: 'Both burst point and landing point are required' });
    }

    const metrics = kmlService.calculatePredictionMetrics(burstPoint, landingPoint);
    
    if (metrics) {
      res.json(metrics);
    } else {
      res.status(400).json({ error: 'Could not calculate prediction metrics' });
    }
  } catch (error) {
    console.error('Error calculating prediction metrics:', error);
    res.status(500).json({ error: 'Failed to calculate prediction metrics' });
  }
});

// Calculate new landing point
router.post('/calculate-landing', async (req, res) => {
  try {
    const { actualBurstLat, actualBurstLon, predictionMetrics } = req.body;
    
    if (!actualBurstLat || !actualBurstLon || !predictionMetrics) {
      return res.status(400).json({ 
        error: 'Actual burst coordinates and prediction metrics are required' 
      });
    }

    const newLandingPoint = kmlService.calculateNewLandingPoint(
      actualBurstLat,
      actualBurstLon,
      predictionMetrics
    );
    
    if (newLandingPoint) {
      res.json(newLandingPoint);
    } else {
      res.status(400).json({ error: 'Could not calculate new landing point' });
    }
  } catch (error) {
    console.error('Error calculating new landing point:', error);
    res.status(500).json({ error: 'Failed to calculate new landing point' });
  }
});

// Clear current prediction
router.delete('/', (req, res) => {
  try {
    trackingService.setPrediction(null);
    res.json({ message: 'Prediction data cleared successfully' });
  } catch (error) {
    console.error('Error clearing prediction data:', error);
    res.status(500).json({ error: 'Failed to clear prediction data' });
  }
});

module.exports = router; 