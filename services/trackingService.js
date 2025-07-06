const aprsService = require('./aprsService');
const kmlService = require('./kmlService');
const configService = require('./configService');
const cron = require('node-cron');

class TrackingService {
  constructor() {
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
  }

  startTracking(io) {
    this.io = io;
    
    // Update tracking data every 30 seconds
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

    } catch (error) {
      console.error('Error updating tracking data:', error);
    }
  }

  updateBalloonData(newData) {
    // Add to history
    this.trackingData.balloon.history.push({
      ...newData,
      timestamp: new Date()
    });

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
  }

  checkForBurst(currentData) {
    if (this.trackingData.balloon.burstDetected) return;

    // Check if altitude is available and below threshold
    if (currentData.altitude && currentData.altitude < this.burstDetectionThreshold) {
      // Check if we have previous data to confirm descent
      if (this.trackingData.balloon.history.length > 1) {
        const previousData = this.trackingData.balloon.history[this.trackingData.balloon.history.length - 2];
        
        if (previousData.altitude && currentData.altitude < previousData.altitude) {
          // Confirm burst - altitude is decreasing and below threshold
          this.trackingData.balloon.burstDetected = true;
          this.trackingData.balloon.actualBurstPoint = {
            latitude: currentData.latitude,
            longitude: currentData.longitude,
            altitude: currentData.altitude,
            timestamp: currentData.timestamp
          };
          
          console.log('BURST DETECTED!', this.trackingData.balloon.actualBurstPoint);
        }
      }
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
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // cPanel-compatible tracking without Socket.IO
  startTrackingForCpanel() {
    // Update tracking data every 30 seconds without Socket.IO
    this.trackingInterval = setInterval(async () => {
      await this.updateTrackingData();
    }, 30000);
    
    console.log('cPanel tracking service started');
  }
}

module.exports = new TrackingService(); 