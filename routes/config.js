const express = require('express');
const configService = require('../services/configService');
const router = express.Router();

// Get current configuration
router.get('/', async (req, res) => {
  try {
    const config = await configService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Update configuration
router.put('/', async (req, res) => {
  try {
    const config = await configService.updateConfig(req.body);
    res.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Set balloon callsign
router.put('/balloon-callsign', async (req, res) => {
  try {
    const { callsign } = req.body;
    if (!callsign) {
      return res.status(400).json({ error: 'Callsign is required' });
    }
    
    const config = await configService.setBalloonCallsign(callsign);
    // Restore last 6 hours of history from aprs.fi
    const trackingService = require('../services/trackingService');
    await trackingService.restoreBalloonHistoryFromAprs();
    res.json(config);
  } catch (error) {
    console.error('Error setting balloon callsign:', error);
    res.status(500).json({ error: 'Failed to set balloon callsign' });
  }
});

// Add chaser callsign
router.post('/chaser-callsigns', async (req, res) => {
  try {
    const { callsign } = req.body;
    if (!callsign) {
      return res.status(400).json({ error: 'Callsign is required' });
    }
    
    const config = await configService.addChaserCallsign(callsign);
    res.json(config);
  } catch (error) {
    console.error('Error adding chaser callsign:', error);
    res.status(500).json({ error: 'Failed to add chaser callsign' });
  }
});

// Remove chaser callsign
router.delete('/chaser-callsigns/:callsign', async (req, res) => {
  try {
    const { callsign } = req.params;
    const config = await configService.removeChaserCallsign(callsign);
    res.json(config);
  } catch (error) {
    console.error('Error removing chaser callsign:', error);
    res.status(500).json({ error: 'Failed to remove chaser callsign' });
  }
});

// Set burst detection altitude
router.put('/burst-detection-altitude', async (req, res) => {
  try {
    const { altitude } = req.body;
    if (!altitude || isNaN(altitude)) {
      return res.status(400).json({ error: 'Valid altitude is required' });
    }
    
    const config = await configService.setBurstDetectionAltitude(altitude);
    res.json(config);
  } catch (error) {
    console.error('Error setting burst detection altitude:', error);
    res.status(500).json({ error: 'Failed to set burst detection altitude' });
  }
});

// Set update interval
router.put('/update-interval', async (req, res) => {
  try {
    const { interval } = req.body;
    if (!interval || isNaN(interval)) {
      return res.status(400).json({ error: 'Valid interval is required' });
    }
    
    const config = await configService.setUpdateInterval(interval);
    res.json(config);
  } catch (error) {
    console.error('Error setting update interval:', error);
    res.status(500).json({ error: 'Failed to set update interval' });
  }
});

// Reset configuration
router.post('/reset', async (req, res) => {
  try {
    const config = await configService.resetConfig();
    res.json(config);
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
});

module.exports = router; 