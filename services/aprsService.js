const axios = require('axios');

class APRSService {
  constructor() {
    this.baseUrl = 'https://api.aprs.fi/api/get';
    this.apiKey = process.env.APRS_API_KEY || 'demo'; // You'll need to get an API key from aprs.fi
  }

  async getStationData(callsign) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          name: callsign,
          what: 'loc',
          apikey: this.apiKey,
          format: 'json'
        },
        headers: {
          'User-Agent': 'balloon-tracker/1.0.0 (+https://n4bwr.com/balloon-tracker/)'
        }
      });

      if (response.data && response.data.entries && response.data.entries.length > 0) {
        const entry = response.data.entries[0];
        return {
          callsign: entry.name,
          latitude: parseFloat(entry.lat),
          longitude: parseFloat(entry.lng),
          altitude: entry.altitude ? parseFloat(entry.altitude) : null,
          timestamp: new Date(entry.time * 1000),
          comment: entry.comment || '',
          symbol: entry.symbol || '',
          course: entry.course ? parseFloat(entry.course) : null,
          speed: entry.speed ? parseFloat(entry.speed) : null
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching APRS data for ${callsign}:`, error.message);
      return null;
    }
  }

  async getMultipleStations(callsigns) {
    const promises = callsigns.map(callsign => this.getStationData(callsign));
    const results = await Promise.allSettled(promises);
    
    return results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
        return null;
      })
      .filter(station => station !== null);
  }

  // Fallback: Fetch and parse APRS raw data from aprs.fi
  async fetchRawTrackData(callsign, start, end) {
    const axios = require('axios');
    const url = `https://aprs.fi/?c=raw&call=${encodeURIComponent(callsign)}`;
    try {
      const res = await axios.get(url);
      const text = res.data;
      const lines = text.split('\n').filter(line => line && !line.startsWith('aprs.fi'));
      const beacons = [];
      const now = Date.now();
      const startTime = start ? start * 1000 : now - 6 * 60 * 60 * 1000;
      const endTime = end ? end * 1000 : now;
      for (const line of lines) {
        // Example: 2024-06-08 14:23:45 UTC: N4BWR-5>APRS,TCPIP*,qAC,T2USAN: !3356.78N/08513.69W>123/045/A=001234 Test comment
        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) UTC: ([^:]+): (.+)$/);
        if (!match) continue;
        const [_, dateStr, header, body] = match;
        const timestamp = Date.parse(dateStr + ' UTC');
        if (isNaN(timestamp) || timestamp < startTime || timestamp > endTime) continue;
        // Parse position (APRS format)
        const posMatch = body.match(/!([0-9]{4}\.\d{2})([NS])\/([0-9]{5}\.\d{2})([EW])[^ ]*/);
        if (!posMatch) continue;
        let lat = parseFloat(posMatch[1].slice(0,2)) + parseFloat(posMatch[1].slice(2)) / 60;
        if (posMatch[2] === 'S') lat = -lat;
        let lon = parseFloat(posMatch[3].slice(0,3)) + parseFloat(posMatch[3].slice(3)) / 60;
        if (posMatch[4] === 'W') lon = -lon;
        // Altitude (A=xxxxx)
        let altitude = null;
        const altMatch = body.match(/A=(\d{6})/);
        if (altMatch) altitude = parseInt(altMatch[1], 10) * 0.3048; // feet to meters
        // Comment
        const comment = body.split('A=')[1] ? body.split('A=')[1].split(' ')[1] : '';
        beacons.push({
          callsign,
          latitude: lat,
          longitude: lon,
          altitude,
          timestamp: new Date(timestamp),
          comment,
          symbol: '',
          course: null,
          speed: null
        });
      }
      return beacons;
    } catch (err) {
      console.error('Error fetching/parsing APRS raw data:', err.message);
      return [];
    }
  }

  async getTrackData(callsign, start, end) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          name: callsign,
          what: 'track',
          apikey: this.apiKey,
          format: 'json',
          start,
          end
        },
        headers: {
          'User-Agent': 'balloon-tracker/1.0.0 (+https://n4bwr.com/balloon-tracker/)'
        }
      });
      if (response.data && response.data.entries && response.data.entries.length > 0) {
        return response.data.entries.map(entry => ({
          callsign: entry.name,
          latitude: parseFloat(entry.lat),
          longitude: parseFloat(entry.lng),
          altitude: entry.altitude ? parseFloat(entry.altitude) : null,
          timestamp: new Date(entry.time * 1000),
          comment: entry.comment || '',
          symbol: entry.symbol || '',
          course: entry.course ? parseFloat(entry.course) : null,
          speed: entry.speed ? parseFloat(entry.speed) : null
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching APRS track data for ${callsign}:`, error.message);
      // Fallback to raw scraping
      return await this.fetchRawTrackData(callsign, start, end);
    }
  }

  // Calculate distance between two points in kilometers
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate bearing between two points in degrees
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = this.toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  // Calculate new point given distance and bearing from a starting point
  calculateDestinationPoint(lat, lon, distance, bearing) {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = this.toRadians(lat);
    const lon1 = this.toRadians(lon);
    const brng = this.toRadians(bearing);
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance/R) + 
      Math.cos(lat1) * Math.sin(distance/R) * Math.cos(brng)
    );
    
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(distance/R) * Math.cos(lat1),
      Math.cos(distance/R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      latitude: this.toDegrees(lat2),
      longitude: this.toDegrees(lon2)
    };
  }
}

module.exports = new APRSService(); 