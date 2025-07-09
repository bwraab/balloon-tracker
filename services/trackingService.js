const aprsService = require('./aprsService');
const kmlService = require('./kmlService');
const configService = require('./configService');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class TrackingService {
  constructor() {
    this.trackingPath = path.join(__dirname, '../data/tracking.json');
    this.trackingData = {
      balloon: {
        current: null,
        history: [],
        burstDetected: false,
        actualBurstPoint: null,
        predictedLanding: null,
        calculatedLanding: null
      },
      chasers: [],
      prediction: null,
      lastUpdate: null
    };
    
    this.trackingInterval = null;
    this.burstDetectionThreshold = 5000; // meters altitude for burst detection
    this.maxHistoryLength = 1000; // Maximum number of historical points to keep
    
    // Burst detection state
    this.burstDetectionState = {
      isMonitoring: false,           // Whether we're actively monitoring for burst
      minimumAltitudeToStart: 3000,  // Start monitoring after reaching 3000m (~10,000ft)
      highestAltitudeReached: 0,     // Track the highest altitude seen
      significantDropThreshold: 1000, // Require 1000m drop to confirm burst
      consecutiveDescentPoints: 0,   // Count consecutive descending points
      requiredDescentPoints: 3       // Need 3 consecutive descending points to confirm burst
    };

    // Load tracking data from file if exists
    this.loadTrackingDataFromFile();
  }

  async loadTrackingDataFromFile() {
    try {
      const data = await fs.readFile(this.trackingPath, 'utf8');
      this.trackingData = JSON.parse(data);
      console.log('Loaded tracking data from file.');
    } catch (error) {
      console.log('No tracking data file found, starting fresh.');
    }
  }

  async saveTrackingDataToFile() {
    try {
      const dataDir = path.dirname(this.trackingPath);
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(this.trackingPath, JSON.stringify(this.trackingData, null, 2));
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }

  startTracking(io) {
    this.io = io;
    
    // Update tracking data every 30 seconds to match balloon beaconing frequency
    this.trackingInterval = setInterval(async () => {
      await this.updateTrackingData();
    }, 30000);

    // Also update every 30 seconds using cron for more precise timing
    cron.schedule('*/30 * * * * *', async () => {
      await this.updateTrackingData();
    });
  }

  async updateTrackingData() {
    try {
      const config = await configService.getConfig();
      
      if (!config.balloonCallsign) {
        console.log('No balloon callsign configured');
        return;
      }

      // Update burst detection threshold from config
      this.burstDetectionThreshold = config.burstDetectionAltitude || 5000;

      // Get balloon data
      const balloonData = await aprsService.getStationData(config.balloonCallsign);
      
      if (balloonData) {
        this.updateBalloonData(balloonData);
      }

      // Get chaser data
      if (config.chaserCallsigns && config.chaserCallsigns.length > 0) {
        const chaserData = await aprsService.getMultipleStations(config.chaserCallsigns);
        this.trackingData.chasers = chaserData;
      }

      this.trackingData.lastUpdate = new Date();
      
      // For cPanel, we don't emit Socket.IO events
      // Data will be fetched via API polling instead

      // Save tracking data to file
      await this.saveTrackingDataToFile();

    } catch (error) {
      console.error('Error updating tracking data:', error);
    }
  }

  // Helper to parse burst comment
  parseBurstComment(comment) {
    // Look for Burst:alt,lat,lon (e.g., Burst:105591.3,33.613055605,-85.228266343)
    const match = comment && comment.match(/Burst:([\d.]+),([\d.\-]+),([\d.\-]+)/);
    if (!match) return null;
    return {
      burstAltitudeFeet: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
      longitude: parseFloat(match[3])
    };
  }

  updateBalloonData(newData) {
    // Add to history
    this.trackingData.balloon.history.push({
      ...newData,
      timestamp: new Date()
    });

    // Check for burst comment in APRS packet
    const burstData = this.parseBurstComment(newData.comment);
    if (burstData) {
      // Convert altitude to meters
      const burstAltitudeMeters = burstData.burstAltitudeFeet * 0.3048;
      this.trackingData.balloon.burstDetected = true;
      this.trackingData.balloon.actualBurstPoint = {
        latitude: burstData.latitude,
        longitude: burstData.longitude,
        altitude: burstAltitudeMeters,
        timestamp: newData.timestamp,
        peakAltitude: burstAltitudeMeters,
        altitudeDrop: null // Not available from comment
      };
      console.log('BURST DETECTED from APRS comment!', this.trackingData.balloon.actualBurstPoint);
      // Trigger landing prediction if available
      if (this.trackingData.prediction) {
        this.calculateNewLandingPoint();
      }
      // Save tracking data to file
      this.saveTrackingDataToFile();
      return; // Skip normal burst detection logic
    }

    // Limit history length
    if (this.trackingData.balloon.history.length > this.maxHistoryLength) {
      this.trackingData.balloon.history = this.trackingData.balloon.history.slice(-this.maxHistoryLength);
    }

    // Update current position
    this.trackingData.balloon.current = newData;

    // Check for burst detection
    this.checkForBurst(newData);

    // Calculate new landing point if burst detected
    if (this.trackingData.balloon.burstDetected && this.trackingData.prediction) {
      this.calculateNewLandingPoint();
    }

    // Save tracking data to file
    this.saveTrackingDataToFile();
  }

  checkForBurst(currentData) {
    if (this.trackingData.balloon.burstDetected) return;

    // Skip if no altitude data
    if (!currentData.altitude) return;

    const currentAltitude = currentData.altitude;
    const state = this.burstDetectionState;

    // Phase 1: Wait for balloon to reach minimum altitude before monitoring
    if (!state.isMonitoring) {
      if (currentAltitude >= state.minimumAltitudeToStart) {
        state.isMonitoring = true;
        state.highestAltitudeReached = currentAltitude;
        console.log(`Burst detection activated at ${currentAltitude}m altitude`);
      }
      return;
    }

    // Phase 2: Track the highest altitude reached
    if (currentAltitude > state.highestAltitudeReached) {
      state.highestAltitudeReached = currentAltitude;
      state.consecutiveDescentPoints = 0; // Reset descent counter on new high
      console.log(`New altitude record: ${currentAltitude}m`);
    }

    // Phase 3: Check for significant altitude drop from peak
    const altitudeDrop = state.highestAltitudeReached - currentAltitude;
    
    if (altitudeDrop >= state.significantDropThreshold) {
      // Check if we have previous data to confirm descent pattern
      if (this.trackingData.balloon.history.length >= 2) {
        const previousData = this.trackingData.balloon.history[this.trackingData.balloon.history.length - 2];
        
        if (previousData.altitude && currentAltitude < previousData.altitude) {
          // Balloon is descending
          state.consecutiveDescentPoints++;
          console.log(`Descent detected: ${currentAltitude}m (drop: ${altitudeDrop}m, consecutive: ${state.consecutiveDescentPoints})`);
          
          // Confirm burst after required consecutive descent points
          if (state.consecutiveDescentPoints >= state.requiredDescentPoints) {
            this.trackingData.balloon.burstDetected = true;
            this.trackingData.balloon.actualBurstPoint = {
              latitude: currentData.latitude,
              longitude: currentData.longitude,
              altitude: currentAltitude,
              timestamp: currentData.timestamp,
              peakAltitude: state.highestAltitudeReached,
              altitudeDrop: altitudeDrop
            };
            
            console.log('BURST DETECTED!', {
              burstAltitude: currentAltitude,
              peakAltitude: state.highestAltitudeReached,
              altitudeDrop: altitudeDrop,
              location: `${currentData.latitude}, ${currentData.longitude}`
            });
          }
        } else {
          // Reset descent counter if altitude increased
          state.consecutiveDescentPoints = 0;
        }
      }
    } else {
      // Reset descent counter if drop is not significant
      state.consecutiveDescentPoints = 0;
    }
  }

  calculateNewLandingPoint() {
    if (!this.trackingData.balloon.actualBurstPoint || !this.trackingData.prediction) {
      return;
    }

    const predictionMetrics = kmlService.calculatePredictionMetrics(
      this.trackingData.prediction.burstPoint,
      this.trackingData.prediction.landingPoint
    );

    if (predictionMetrics) {
      const newLandingPoint = kmlService.calculateNewLandingPoint(
        this.trackingData.balloon.actualBurstPoint.latitude,
        this.trackingData.balloon.actualBurstPoint.longitude,
        predictionMetrics
      );

      if (newLandingPoint) {
        this.trackingData.balloon.calculatedLanding = {
          ...newLandingPoint,
          calculatedAt: new Date(),
          predictionMetrics: predictionMetrics
        };

        console.log('New landing point calculated:', this.trackingData.balloon.calculatedLanding);
      }
    }
  }

  setPrediction(predictionData) {
    this.trackingData.prediction = predictionData;
    
    // Calculate prediction metrics
    if (predictionData.burstPoint && predictionData.landingPoint) {
      const metrics = kmlService.calculatePredictionMetrics(
        predictionData.burstPoint,
        predictionData.landingPoint
      );
      
      if (metrics) {
        this.trackingData.prediction.metrics = metrics;
        console.log('Prediction metrics calculated:', metrics);
      }
    }
  }

  getCurrentData() {
    return this.trackingData;
  }

  resetTracking() {
    this.trackingData = {
      balloon: {
        current: null,
        history: [],
        burstDetected: false,
        actualBurstPoint: null,
        predictedLanding: null,
        calculatedLanding: null
      },
      chasers: [],
      prediction: null,
      lastUpdate: null
    };
    
    // Reset burst detection state
    this.burstDetectionState = {
      isMonitoring: false,
      minimumAltitudeToStart: 3000,
      highestAltitudeReached: 0,
      significantDropThreshold: 1000,
      consecutiveDescentPoints: 0,
      requiredDescentPoints: 3
    };
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // cPanel-compatible tracking without Socket.IO
  startTrackingForCpanel() {
    // Update tracking data every 30 seconds to match balloon beaconing frequency
    this.trackingInterval = setInterval(async () => {
      await this.updateTrackingData();
    }, 30000);
    
    console.log('cPanel tracking service started');
  }

  async restoreBalloonHistoryFromAprs() {
    const config = await configService.getConfig();
    if (!config.balloonCallsign) return;
    const now = Math.floor(Date.now() / 1000);
    const sixHoursAgo = now - 6 * 60 * 60;
    const history = await aprsService.getTrackData(config.balloonCallsign, sixHoursAgo, now);
    if (history && history.length > 0) {
      this.trackingData.balloon.history = history;
      this.trackingData.balloon.current = history[history.length - 1];
      await this.saveTrackingDataToFile();
      console.log('Restored balloon history from aprs.fi');
    }
  }
}

module.exports = new TrackingService(); 