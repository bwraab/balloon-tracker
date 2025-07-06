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
      if (!kml || !kml.Document) {
        console.log('No KML Document found');
        return flightData;
      }

      const document = kml.Document[0];
      console.log('Processing KML Document');
      
      // Extract Placemarks
      if (document.Placemark) {
        console.log(`Found ${document.Placemark.length} placemarks`);
        
        document.Placemark.forEach((placemark, index) => {
          const name = placemark.name ? placemark.name[0] : '';
          const description = placemark.description ? placemark.description[0] : '';
          
          console.log(`Processing placemark ${index + 1}: "${name}"`);
          
          // First priority: Extract flight path (LineString)
          if (placemark.LineString) {
            console.log('Found LineString for flight path');
            const coordinates = this.extractLineStringCoordinates(placemark.LineString[0]);
            console.log(`Extracted ${coordinates.length} path points`);
            flightData.path = coordinates;
          }
          
          // Also check for MultiGeometry with LineString
          else if (placemark.MultiGeometry) {
            console.log('Found MultiGeometry, checking for LineString');
            const multiGeometry = placemark.MultiGeometry[0];
            if (multiGeometry.LineString) {
              console.log('Found LineString in MultiGeometry');
              const coordinates = this.extractLineStringCoordinates(multiGeometry.LineString[0]);
              console.log(`Extracted ${coordinates.length} path points from MultiGeometry`);
              flightData.path = coordinates;
            }
          }
          
          // Second priority: Look for burst point (only if not already found)
          else if (this.isBurstPoint(name, description) && !flightData.burstPoint) {
            console.log('Found burst point:', name);
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
          
          // Third priority: Look for landing point (only if not already found)
          else if (this.isLandingPoint(name, description) && !flightData.landingPoint) {
            console.log('Found landing point:', name);
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
          
          // Fourth priority: Extract waypoints (Point elements)
          else if (placemark.Point) {
            console.log('Found Point waypoint:', name);
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
          
          // If no specific type found, check if it might be a path
          else if (!name.toLowerCase().includes('burst') && 
                   !name.toLowerCase().includes('landing') && 
                   !name.toLowerCase().includes('pop') &&
                   !name.toLowerCase().includes('touchdown')) {
            console.log('Checking for alternative path representation');
            // Some KML files might have the path in a different structure
            if (placemark.LineString) {
              console.log('Found alternative LineString');
              const coordinates = this.extractLineStringCoordinates(placemark.LineString[0]);
              if (coordinates.length > 0) {
                console.log(`Extracted ${coordinates.length} path points from alternative source`);
                flightData.path = coordinates;
              }
            }
          }
        });
      }
      
      // If no path found in placemarks, try to find it in other structures
      if (flightData.path.length === 0) {
        console.log('No path found in placemarks, checking other structures');
        this.findPathInOtherStructures(document, flightData);
      }
      
      console.log('Final flight data:', {
        pathPoints: flightData.path.length,
        hasBurstPoint: !!flightData.burstPoint,
        hasLandingPoint: !!flightData.landingPoint,
        waypoints: flightData.waypoints.length
      });
      
    } catch (error) {
      console.error('Error extracting flight data:', error);
    }

    return flightData;
  }

  findPathInOtherStructures(document, flightData) {
    // Check for paths in other KML structures
    if (document.Folder) {
      document.Folder.forEach(folder => {
        if (folder.Placemark) {
          folder.Placemark.forEach(placemark => {
            if (placemark.LineString && flightData.path.length === 0) {
              console.log('Found LineString in Folder');
              const coordinates = this.extractLineStringCoordinates(placemark.LineString[0]);
              if (coordinates.length > 0) {
                console.log(`Extracted ${coordinates.length} path points from Folder`);
                flightData.path = coordinates;
              }
            }
          });
        }
      });
    }
  }

  isBurstPoint(name, description) {
    const text = (name + ' ' + description).toLowerCase();
    // More specific burst detection - avoid matching "flight path"
    return (text.includes('burst') || text.includes('pop') || text.includes('explosion')) && 
           !text.includes('flight') && 
           !text.includes('path') &&
           !text.includes('trajectory');
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
      console.log('Processing LineString coordinates:', coordString.substring(0, 100) + '...');
      
      // Handle different coordinate formats
      const coordPairs = coordString.trim().split(/\s+/); // Split on whitespace
      
      console.log(`Found ${coordPairs.length} coordinate pairs`);
      
      coordPairs.forEach((pair, index) => {
        const parts = pair.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const alt = parts.length > 2 ? parseFloat(parts[2]) : 0;
          
          // Validate coordinates
          if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            coordinates.push({
              lng: lng,
              lat: lat,
              alt: alt
            });
          } else {
            console.log(`Skipping invalid coordinates at index ${index}: ${pair}`);
          }
        } else {
          console.log(`Skipping malformed coordinate pair at index ${index}: ${pair}`);
        }
      });
      
      console.log(`Successfully extracted ${coordinates.length} valid coordinates`);
    } else {
      console.log('No coordinates found in LineString');
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