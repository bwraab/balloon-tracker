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
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmNDM5MzYiIHN0cm9rZT0iI2QzMmYyZiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjYiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const chaserIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iIzQyYzM5NyIvPgo8L3N2Zz4=',
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

  useEffect(() => {
    // Load initial configuration and tracking data
    loadConfig();
    loadTrackingData();

    // Set up polling for updates every 30 seconds
    const interval = setInterval(() => {
      loadTrackingData();
    }, 30000);

    return () => {
      clearInterval(interval);
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
    if (trackingData.balloon.current) {
      return [trackingData.balloon.current.latitude, trackingData.balloon.current.longitude];
    }
    if (trackingData.prediction && trackingData.prediction.burstPoint) {
      return [trackingData.prediction.burstPoint.latitude, trackingData.prediction.burstPoint.longitude];
    }
    return [39.8283, -98.5795]; // Default to center of USA
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAltitude = (altitude) => {
    if (!altitude) return 'Unknown';
    return `${Math.round(altitude)}m`;
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown';
    return `${distance.toFixed(1)}km`;
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
        zoom={8} 
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                <p><strong>Speed:</strong> {trackingData.balloon.current.speed ? `${trackingData.balloon.current.speed} km/h` : 'Unknown'}</p>
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

        {/* Actual burst point */}
        {trackingData.balloon.actualBurstPoint && (
          <Marker 
            position={[trackingData.balloon.actualBurstPoint.latitude, trackingData.balloon.actualBurstPoint.longitude]}
            icon={burstIcon}
          >
            <Popup>
              <div>
                <h3>Actual Burst Point</h3>
                <p><strong>Altitude:</strong> {formatAltitude(trackingData.balloon.actualBurstPoint.altitude)}</p>
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
                <p><strong>Speed:</strong> {chaser.speed ? `${chaser.speed} km/h` : 'Unknown'}</p>
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
            radius={5000} // 5km radius
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