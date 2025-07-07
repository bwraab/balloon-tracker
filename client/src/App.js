import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Settings, 
  Upload, 
  Radio, 
  Users, 
  Target, 
  Navigation,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import apiConfig from './config';
import './App.css';

// Custom icons for different markers
const balloonIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI2IiBmaWxsPSIjZDMzMzMzIiBzdHJva2U9IiM5OTAwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMTRMMTIgMjAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMCwyMEwxNCwyMCIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTExLDE2TDEzLDE2IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMTEsMThMMTMtMTgiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const chaserIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iNCIvPgo8L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const burstIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmZjY3MDAiIHN0cm9rZT0iI2U2NWEwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiA2VjE4TTYgMTJIMThNOCA4TDE2IDE2TTE2IDhMOCAxNiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const landingIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyOGE3NDUiIHN0cm9rZT0iIzFlN2UzNCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiA2VjE4TTYgMTJIMThNMTIgMTZMMTAgMTRIMTRMMTIgMTZaIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const pathPointIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjQiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iI2NjMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6]
});

function App() {
  const [trackingData, setTrackingData] = useState({
    balloon: {
      current: null,
      history: [],
      burstDetected: false,
      actualBurstPoint: null,
      calculatedLanding: null
    },
    chasers: [],
    prediction: null,
    lastUpdate: null
  });
  
  const [config, setConfig] = useState({
    balloonCallsign: '',
    chaserCallsigns: [],
    burstDetectionAltitude: 5000,
    updateInterval: 30000
  });
  
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [isSatelliteView, setIsSatelliteView] = useState(false);

  useEffect(() => {
    // Load initial configuration and tracking data
    loadConfig();
    loadTrackingData();

    // Set up polling for updates every 30 seconds
    const interval = setInterval(() => {
      loadTrackingData();
    }, 30000);

    // --- KEEP-ALIVE TIMER ---
    // Ping the backend every 10 minutes to keep Render awake
    const keepAlive = setInterval(() => {
      fetch(`${apiConfig.API_BASE_URL}/api/tracking`);
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(interval);
      clearInterval(keepAlive);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const response = await axios.get(`${apiConfig.API_BASE_URL}/api/config`);
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    }
  };

  const loadTrackingData = async () => {
    try {
      const response = await axios.get(`${apiConfig.API_BASE_URL}/api/tracking`);
      setTrackingData(response.data);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast.error('Failed to load tracking data');
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const response = await axios.put(`${apiConfig.API_BASE_URL}/api/config`, newConfig);
      setConfig(response.data);
      toast.success('Configuration updated');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const resetTracking = async () => {
    try {
      await axios.post(`${apiConfig.API_BASE_URL}/api/tracking/reset`);
      toast.success('Tracking data reset');
      loadTrackingData();
    } catch (error) {
      console.error('Error resetting tracking:', error);
      toast.error('Failed to reset tracking data');
    }
  };

  // Calculate map center based on available data
  const getMapCenter = () => {
    // Priority 1: Current balloon position
    if (trackingData.balloon.current) {
      return [trackingData.balloon.current.latitude, trackingData.balloon.current.longitude];
    }
    
    // Priority 2: Predicted burst point
    if (trackingData.prediction && trackingData.prediction.burstPoint) {
      return [trackingData.prediction.burstPoint.latitude, trackingData.prediction.burstPoint.longitude];
    }
    
    // Priority 3: Predicted landing point
    if (trackingData.prediction && trackingData.prediction.landingPoint) {
      return [trackingData.prediction.landingPoint.latitude, trackingData.prediction.landingPoint.longitude];
    }
    
    // Priority 4: Center of prediction path (if available)
    if (trackingData.prediction && trackingData.prediction.path && trackingData.prediction.path.length > 0) {
      const midIndex = Math.floor(trackingData.prediction.path.length / 2);
      const midPoint = trackingData.prediction.path[midIndex];
      return [midPoint.lat, midPoint.lng];
    }
    
    // Priority 5: Actual burst point
    if (trackingData.balloon.actualBurstPoint) {
      return [trackingData.balloon.actualBurstPoint.latitude, trackingData.balloon.actualBurstPoint.longitude];
    }
    
    // Priority 6: Calculated landing point
    if (trackingData.balloon.calculatedLanding) {
      return [trackingData.balloon.calculatedLanding.latitude, trackingData.balloon.calculatedLanding.longitude];
    }
    
    // Default: Center of Georgia (Atlanta area)
    return [33.7490, -84.3880]; // Atlanta, GA
  };

  const getMapZoom = () => {
    // If we have a current balloon position, zoom in closer
    if (trackingData.balloon.current) {
      return 10;
    }
    
    // If we have prediction data, use medium zoom
    if (trackingData.prediction && (trackingData.prediction.burstPoint || trackingData.prediction.landingPoint)) {
      return 9;
    }
    
    // If we have a flight path, zoom to fit the path
    if (trackingData.prediction && trackingData.prediction.path && trackingData.prediction.path.length > 1) {
      return 8;
    }
    
    // Default zoom for Georgia
    return 7;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAltitude = (altitude) => {
    if (!altitude) return 'Unknown';
    const feet = Math.round(altitude * 3.28084); // Convert meters to feet
    return `${feet}ft`;
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown';
    const miles = distance * 0.621371; // Convert km to miles
    return `${miles.toFixed(1)}mi`;
  };

  const formatBearing = (bearing) => {
    if (!bearing) return 'Unknown';
    return `${bearing.toFixed(1)}°`;
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      
      {/* Control Panel Toggle */}
      <button 
        className="control-toggle"
        onClick={() => setShowControlPanel(!showControlPanel)}
      >
        {showControlPanel ? <Settings size={20} /> : <Settings size={20} />}
      </button>

      {/* Satellite View Toggle */}
      <button 
        className="satellite-toggle"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: isSatelliteView ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        onClick={() => setIsSatelliteView(!isSatelliteView)}
      >
        {isSatelliteView ? 'Map View' : 'Satellite View'}
      </button>

      {/* Control Panel */}
      {showControlPanel && (
        <ControlPanel 
          config={config}
          trackingData={trackingData}
          onUpdateConfig={updateConfig}
          onResetTracking={resetTracking}
        />
      )}

      {/* Map */}
      <MapContainer 
        center={getMapCenter()} 
        zoom={getMapZoom()} 
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          url={isSatelliteView 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution={isSatelliteView 
            ? '&copy; <a href="https://www.esri.com/">Esri</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        />

        {/* Balloon current position */}
        {trackingData.balloon.current && (
          <Marker 
            position={[trackingData.balloon.current.latitude, trackingData.balloon.current.longitude]}
            icon={balloonIcon}
          >
            <Popup>
              <div>
                <h3>Balloon: {trackingData.balloon.current.callsign}</h3>
                <p><strong>Altitude:</strong> {formatAltitude(trackingData.balloon.current.altitude)}</p>
                <p><strong>Speed:</strong> {trackingData.balloon.current.speed ? `${Math.round(trackingData.balloon.current.speed * 0.621371)} mph` : 'Unknown'}</p>
                <p><strong>Course:</strong> {trackingData.balloon.current.course ? `${trackingData.balloon.current.course}°` : 'Unknown'}</p>
                <p><strong>Time:</strong> {formatTime(trackingData.balloon.current.timestamp)}</p>
                {trackingData.balloon.current.comment && (
                  <p><strong>Comment:</strong> {trackingData.balloon.current.comment}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Balloon flight path */}
        {trackingData.balloon.history.length > 1 && (
          <Polyline
            positions={trackingData.balloon.history.map(point => [point.latitude, point.longitude])}
            color="red"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Balloon path points */}
        {trackingData.balloon.history.map((point, index) => (
          <Marker 
            key={`path-point-${index}`}
            position={[point.latitude, point.longitude]}
            icon={pathPointIcon}
          >
            <Popup>
              <div>
                <h3>Beacon #{index + 1}</h3>
                <p><strong>Time:</strong> {formatTime(point.timestamp)}</p>
                <p><strong>Altitude:</strong> {formatAltitude(point.altitude)}</p>
                <p><strong>Speed:</strong> {point.speed ? `${Math.round(point.speed * 0.621371)} mph` : 'Unknown'}</p>
                <p><strong>Course:</strong> {point.course ? `${point.course}°` : 'Unknown'}</p>
                <p><strong>Coordinates:</strong> {point.latitude.toFixed(7)} {point.longitude.toFixed(7)}</p>
                {point.comment && (
                  <p><strong>Comment:</strong> {point.comment}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Actual burst point */}
        {trackingData.balloon.actualBurstPoint && (
          <Marker 
            position={[trackingData.balloon.actualBurstPoint.latitude, trackingData.balloon.actualBurstPoint.longitude]}
            icon={burstIcon}
          >
            <Popup>
              <div>
                <h3>Actual Burst Point</h3>
                <p><strong>Burst Altitude:</strong> {formatAltitude(trackingData.balloon.actualBurstPoint.altitude)}</p>
                {trackingData.balloon.actualBurstPoint.peakAltitude && (
                  <p><strong>Peak Altitude:</strong> {formatAltitude(trackingData.balloon.actualBurstPoint.peakAltitude)}</p>
                )}
                {trackingData.balloon.actualBurstPoint.altitudeDrop && (
                  <p><strong>Altitude Drop:</strong> {formatAltitude(trackingData.balloon.actualBurstPoint.altitudeDrop)}</p>
                )}
                <p><strong>Time:</strong> {formatTime(trackingData.balloon.actualBurstPoint.timestamp)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Calculated landing point */}
        {trackingData.balloon.calculatedLanding && (
          <Marker 
            position={[trackingData.balloon.calculatedLanding.latitude, trackingData.balloon.calculatedLanding.longitude]}
            icon={landingIcon}
          >
            <Popup>
              <div>
                <h3>Calculated Landing Point</h3>
                <p><strong>Coordinates:</strong> {trackingData.balloon.calculatedLanding.latitude.toFixed(7)} {trackingData.balloon.calculatedLanding.longitude.toFixed(7)}</p>
                <p><strong>Distance from burst:</strong> {formatDistance(trackingData.balloon.calculatedLanding.predictionMetrics.distance)}</p>
                <p><strong>Bearing from burst:</strong> {formatBearing(trackingData.balloon.calculatedLanding.predictionMetrics.bearing)}</p>
                <p><strong>Calculated at:</strong> {formatTime(trackingData.balloon.calculatedLanding.calculatedAt)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Prediction path */}
        {trackingData.prediction && trackingData.prediction.path && trackingData.prediction.path.length > 1 && (
          <Polyline
            positions={trackingData.prediction.path.map(point => [point.lat, point.lng])}
            color="blue"
            weight={2}
            opacity={0.5}
            dashArray="10, 5"
          />
        )}

        {/* Predicted burst point */}
        {trackingData.prediction && trackingData.prediction.burstPoint && (
          <Marker 
            position={[trackingData.prediction.burstPoint.latitude, trackingData.prediction.burstPoint.longitude]}
            icon={burstIcon}
          >
            <Popup>
              <div>
                <h3>Predicted Burst Point</h3>
                <p><strong>Altitude:</strong> {formatAltitude(trackingData.prediction.burstPoint.altitude)}</p>
                <p><strong>Name:</strong> {trackingData.prediction.burstPoint.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Predicted landing point */}
        {trackingData.prediction && trackingData.prediction.landingPoint && (
          <Marker 
            position={[trackingData.prediction.landingPoint.latitude, trackingData.prediction.landingPoint.longitude]}
            icon={landingIcon}
          >
            <Popup>
              <div>
                <h3>Predicted Landing Point</h3>
                <p><strong>Coordinates:</strong> {trackingData.prediction.landingPoint.latitude.toFixed(7)} {trackingData.prediction.landingPoint.longitude.toFixed(7)}</p>
                <p><strong>Altitude:</strong> {formatAltitude(trackingData.prediction.landingPoint.altitude)}</p>
                <p><strong>Name:</strong> {trackingData.prediction.landingPoint.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Chasers */}
        {trackingData.chasers.map((chaser, index) => (
          <Marker 
            key={`${chaser.callsign}-${index}`}
            position={[chaser.latitude, chaser.longitude]}
            icon={chaserIcon}
          >
            <Popup>
              <div>
                <h3>Chaser: {chaser.callsign}</h3>
                <p><strong>Altitude:</strong> {formatAltitude(chaser.altitude)}</p>
                <p><strong>Speed:</strong> {chaser.speed ? `${Math.round(chaser.speed * 0.621371)} mph` : 'Unknown'}</p>
                <p><strong>Course:</strong> {chaser.course ? `${chaser.course}°` : 'Unknown'}</p>
                <p><strong>Time:</strong> {formatTime(chaser.timestamp)}</p>
                {chaser.comment && (
                  <p><strong>Comment:</strong> {chaser.comment}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Landing point search radius (if calculated) */}
        {trackingData.balloon.calculatedLanding && (
          <Circle
            center={[trackingData.balloon.calculatedLanding.latitude, trackingData.balloon.calculatedLanding.longitude]}
            radius={3107} // 3.1 miles radius (converted from 5km)
            color="green"
            fillColor="green"
            fillOpacity={0.1}
            weight={2}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default App; 