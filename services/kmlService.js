const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

class KMLService {
  constructor() {
    this.parser = new xml2js.Parser();
    this.builder = new xml2js.Builder();
  }

  async parseKMLFile(filePath) {
    try {
      const kmlContent = await fs.readFile(filePath, 'utf8');
      const result = await this.parser.parseStringPromise(kmlContent);
      
      return this.extractFlightData(result);
    } catch (error) {
      console.error('Error parsing KML file:', error);
      throw error;
    }
  }

  async parseKMLContent(kmlContent) {
    try {
      const result = await this.parser.parseStringPromise(kmlContent);
      return this.extractFlightData(result);
    } catch (error) {
      console.error('Error parsing KML content:', error);
      throw error;
    }
  }

  extractFlightData(kmlData) {
    const flightData = {
      path: [],
      burstPoint: null,
      landingPoint: null,
      waypoints: []
    };

    try {
      const kml = kmlData.kml;
      if (!kml || !kml.Document) return flightData;

      const document = kml.Document[0];
      
      // Extract Placemarks
      if (document.Placemark) {
        document.Placemark.forEach(placemark => {
          const name = placemark.name ? placemark.name[0] : '';
          const description = placemark.description ? placemark.description[0] : '';
          
          // Look for burst point
          if (this.isBurstPoint(name, description)) {
            const coordinates = this.extractCoordinates(placemark);
            if (coordinates.length > 0) {
              flightData.burstPoint = {
                latitude: coordinates[0].lat,
                longitude: coordinates[0].lng,
                altitude: coordinates[0].alt || 0,
                name: name,
                description: description
              };
            }
          }
          
          // Look for landing point
          else if (this.isLandingPoint(name, description)) {
            const coordinates = this.extractCoordinates(placemark);
            if (coordinates.length > 0) {
              flightData.landingPoint = {
                latitude: coordinates[0].lat,
                longitude: coordinates[0].lng,
                altitude: coordinates[0].alt || 0,
                name: name,
                description: description
              };
            }
          }
          
          // Extract flight path
          else if (placemark.LineString) {
            const coordinates = this.extractLineStringCoordinates(placemark.LineString[0]);
            flightData.path = coordinates;
          }
          
          // Extract waypoints
          else if (placemark.Point) {
            const coordinates = this.extractCoordinates(placemark);
            if (coordinates.length > 0) {
              flightData.waypoints.push({
                latitude: coordinates[0].lat,
                longitude: coordinates[0].lng,
                altitude: coordinates[0].alt || 0,
                name: name,
                description: description
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error extracting flight data:', error);
    }

    return flightData;
  }

  isBurstPoint(name, description) {
    const text = (name + ' ' + description).toLowerCase();
    return text.includes('burst') || text.includes('pop') || text.includes('explosion');
  }

  isLandingPoint(name, description) {
    const text = (name + ' ' + description).toLowerCase();
    return text.includes('landing') || text.includes('touchdown') || text.includes('impact');
  }

  extractCoordinates(placemark) {
    const coordinates = [];
    
    if (placemark.Point && placemark.Point[0].coordinates) {
      const coordString = placemark.Point[0].coordinates[0];
      const parts = coordString.trim().split(',');
      
      if (parts.length >= 2) {
        coordinates.push({
          lng: parseFloat(parts[0]),
          lat: parseFloat(parts[1]),
          alt: parts.length > 2 ? parseFloat(parts[2]) : 0
        });
      }
    }
    
    return coordinates;
  }

  extractLineStringCoordinates(lineString) {
    const coordinates = [];
    
    if (lineString.coordinates) {
      const coordString = lineString.coordinates[0];
      const coordPairs = coordString.trim().split(' ');
      
      coordPairs.forEach(pair => {
        const parts = pair.split(',');
        if (parts.length >= 2) {
          coordinates.push({
            lng: parseFloat(parts[0]),
            lat: parseFloat(parts[1]),
            alt: parts.length > 2 ? parseFloat(parts[2]) : 0
          });
        }
      });
    }
    
    return coordinates;
  }

  // Calculate bearing and distance between predicted burst and landing
  calculatePredictionMetrics(burstPoint, landingPoint) {
    if (!burstPoint || !landingPoint) {
      return null;
    }

    const distance = this.calculateDistance(
      burstPoint.latitude, burstPoint.longitude,
      landingPoint.latitude, landingPoint.longitude
    );

    const bearing = this.calculateBearing(
      burstPoint.latitude, burstPoint.longitude,
      landingPoint.latitude, landingPoint.longitude
    );

    return {
      distance: distance, // in kilometers
      bearing: bearing,   // in degrees
      burstPoint: burstPoint,
      landingPoint: landingPoint
    };
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

  // Calculate new landing point based on actual burst location and prediction metrics
  calculateNewLandingPoint(actualBurstLat, actualBurstLon, predictionMetrics) {
    if (!predictionMetrics) return null;

    const R = 6371; // Earth's radius in kilometers
    const lat1 = this.toRadians(actualBurstLat);
    const lon1 = this.toRadians(actualBurstLon);
    const brng = this.toRadians(predictionMetrics.bearing);
    const distance = predictionMetrics.distance;
    
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
      longitude: this.toDegrees(lon2),
      calculatedFrom: {
        actualBurstLat,
        actualBurstLon,
        predictionDistance: distance,
        predictionBearing: predictionMetrics.bearing
      }
    };
  }
}

module.exports = new KMLService(); 