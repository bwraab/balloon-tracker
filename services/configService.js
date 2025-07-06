const fs = require('fs').promises;
const path = require('path');

class ConfigService {
  constructor() {
    this.configPath = path.join(__dirname, '../data/config.json');
    this.defaultConfig = {
      balloonCallsign: '',
      chaserCallsigns: [],
      burstDetectionAltitude: 5000, // meters
      updateInterval: 30000, // milliseconds
      maxHistoryLength: 1000
    };
    this.config = null;
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = { ...this.defaultConfig, ...JSON.parse(configData) };
    } catch (error) {
      console.log('No config file found, using defaults');
      this.config = { ...this.defaultConfig };
      await this.saveConfig();
    }
  }

  async saveConfig() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  async getConfig() {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config;
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    return this.config;
  }

  async setBalloonCallsign(callsign) {
    this.config.balloonCallsign = callsign.toUpperCase();
    await this.saveConfig();
    return this.config;
  }

  async addChaserCallsign(callsign) {
    const upperCallsign = callsign.toUpperCase();
    if (!this.config.chaserCallsigns.includes(upperCallsign)) {
      this.config.chaserCallsigns.push(upperCallsign);
      await this.saveConfig();
    }
    return this.config;
  }

  async removeChaserCallsign(callsign) {
    const upperCallsign = callsign.toUpperCase();
    this.config.chaserCallsigns = this.config.chaserCallsigns.filter(
      c => c !== upperCallsign
    );
    await this.saveConfig();
    return this.config;
  }

  async setBurstDetectionAltitude(altitude) {
    this.config.burstDetectionAltitude = parseInt(altitude);
    await this.saveConfig();
    return this.config;
  }

  async setUpdateInterval(interval) {
    this.config.updateInterval = parseInt(interval);
    await this.saveConfig();
    return this.config;
  }

  async resetConfig() {
    this.config = { ...this.defaultConfig };
    await this.saveConfig();
    return this.config;
  }
}

module.exports = new ConfigService(); 