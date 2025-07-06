const express = require('express');
const trackingService = require('../services/trackingService');
const router = express.Router();

// Get current tracking data
router.get('/', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json(data);
  } catch (error) {
    console.error('Error getting tracking data:', error);
    res.status(500).json({ error: 'Failed to get tracking data' });
  }
});

// Reset tracking data
router.post('/reset', (req, res) => {
  try {
    trackingService.resetTracking();
    res.json({ message: 'Tracking data reset successfully' });
  } catch (error) {
    console.error('Error resetting tracking data:', error);
    res.status(500).json({ error: 'Failed to reset tracking data' });
  }
});

// Get balloon history
router.get('/balloon/history', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json(data.balloon.history);
  } catch (error) {
    console.error('Error getting balloon history:', error);
    res.status(500).json({ error: 'Failed to get balloon history' });
  }
});

// Get chaser data
router.get('/chasers', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json(data.chasers);
  } catch (error) {
    console.error('Error getting chaser data:', error);
    res.status(500).json({ error: 'Failed to get chaser data' });
  }
});

// Get prediction data
router.get('/prediction', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json(data.prediction);
  } catch (error) {
    console.error('Error getting prediction data:', error);
    res.status(500).json({ error: 'Failed to get prediction data' });
  }
});

// Get burst information
router.get('/burst', (req, res) => {
  try {
    const data = trackingService.getCurrentData();
    res.json({
      burstDetected: data.balloon.burstDetected,
      actualBurstPoint: data.balloon.actualBurstPoint,
      calculatedLanding: data.balloon.calculatedLanding
    });
  } catch (error) {
    console.error('Error getting burst data:', error);
    res.status(500).json({ error: 'Failed to get burst data' });
  }
});

module.exports = router; 