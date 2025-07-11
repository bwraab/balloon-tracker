import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  Radio, 
  Users, 
  Target, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import apiConfig from '../config';

const ControlPanel = ({ config, trackingData, onUpdateConfig, onResetTracking, headingText }) => {
  const [newChaserCallsign, setNewChaserCallsign] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  const [burstAltitudeInput, setBurstAltitudeInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '';

  // Initialize burst altitude input only once when component mounts
  React.useEffect(() => {
    if (!burstAltitudeInput) {
      setBurstAltitudeInput(Math.round(config.burstDetectionAltitude * 3.28084).toString());
    }
  }, []); // Empty dependency array - only run once

  // Debounced update for burst altitude
  const updateBurstAltitude = useCallback((inputValue) => {
    if (!isAuthenticated) return;
    const timeoutId = setTimeout(() => {
      const feetValue = parseInt(inputValue) || 0;
      const metersValue = Math.round(feetValue / 3.28084);
      onUpdateConfig({ burstDetectionAltitude: metersValue });
    }, 1000); // Wait 1 second after user stops typing
    return () => clearTimeout(timeoutId);
  }, [onUpdateConfig, isAuthenticated]);

  // Handle burst altitude input change
  const handleBurstAltitudeChange = (e) => {
    const value = e.target.value;
    setBurstAltitudeInput(value);
    updateBurstAltitude(value);
  };

  const onDrop = async (acceptedFiles) => {
    if (!requireAuth('upload KML file')) return;
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('kmlFile', file);

    try {
      const response = await axios.post(`${apiConfig.API_BASE_URL}/api/kml/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('KML file uploaded successfully');
      console.log('Prediction data:', response.data.prediction);
    } catch (error) {
      console.error('Error uploading KML:', error);
      toast.error('Failed to upload KML file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'text/xml': ['.kml']
    },
    multiple: false
  });

  const handleBalloonCallsignChange = async (e) => {
    if (!requireAuth('modify balloon callsign')) return;
    const callsign = e.target.value;
    await onUpdateConfig({ balloonCallsign: callsign });
  };

  const handleAddChaser = async () => {
    if (!newChaserCallsign.trim()) return;
    
    try {
      await axios.post(`${apiConfig.API_BASE_URL}/api/config/chaser-callsigns`, { callsign: newChaserCallsign });
      setNewChaserCallsign('');
      toast.success('Chaser added');
      // Reload config to get updated chaser list
      window.location.reload();
    } catch (error) {
      console.error('Error adding chaser:', error);
      toast.error('Failed to add chaser');
    }
  };

  const handleRemoveChaser = async (callsign) => {
    if (!requireAuth('remove chaser')) return;
    try {
      await axios.delete(`${apiConfig.API_BASE_URL}/api/config/chaser-callsigns/${callsign}`);
      toast.success('Chaser removed');
      // Reload config to get updated chaser list
      window.location.reload();
    } catch (error) {
      console.error('Error removing chaser:', error);
      toast.error('Failed to remove chaser');
    }
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

  const getStatusIndicator = (timestamp) => {
    if (!timestamp) return 'status-unknown';
    const now = new Date();
    const timeDiff = now - new Date(timestamp);
    if (timeDiff < 300000) return 'status-online'; // 5 minutes
    if (timeDiff < 1800000) return 'status-unknown'; // 30 minutes
    return 'status-offline';
  };

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setPassword('');
      setError('');
      toast.success('Admin access granted');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // Clear error when modal closes
  useEffect(() => {
    if (!showPasswordPrompt) setError('');
  }, [showPasswordPrompt]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast.success('Logged out');
  };

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      setShowPasswordPrompt(true);
      return false;
    }
    return true;
  };

  return (
    <div className="control-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0, zIndex: 1200, background: 'white', padding: '4px 12px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center' }}>
          {headingText || 'Balloon Tracker by N4BWR'}
          {trackingData.balloon.burstDetected && (
            <span style={{
              marginLeft: 12,
              color: '#fff',
              background: '#d9534f',
              borderRadius: 4,
              padding: '2px 8px',
              fontWeight: 'bold',
              fontSize: '0.9em',
              verticalAlign: 'middle',
              letterSpacing: '1px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              BURST DETECTED
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: '12px', color: '#28a745' }}>Admin Access</span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '10px' }}
                onClick={handleLogout}
              >
                <Unlock size={12} />
              </button>
            </>
          ) : (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '10px' }}
              onClick={() => setShowPasswordPrompt(true)}
            >
              <Lock size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Admin Access Required</h3>
            <p style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
              Enter password to modify settings or reset tracking data.
            </p>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
                onClick={handlePasswordSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '15px', borderBottom: '1px solid #eee' }}>
        <button 
          className={`btn ${activeTab === 'config' ? 'btn-success' : 'btn-secondary'}`}
          style={{ flex: 1, marginRight: '5px' }}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={14} />
        </button>
        <button 
          className={`btn ${activeTab === 'tracking' ? 'btn-success' : 'btn-secondary'}`}
          style={{ flex: 1, marginRight: '5px' }}
          onClick={() => setActiveTab('tracking')}
        >
          <Radio size={14} />
        </button>
        <button 
          className={`btn ${activeTab === 'chasers' ? 'btn-success' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('chasers')}
        >
          <Users size={14} />
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="scrollable-content">
          <h3>Configuration</h3>
          
          <div className="form-group">
            <label>Balloon Callsign</label>
            <input
              type="text"
              value={config.balloonCallsign}
              onChange={handleBalloonCallsignChange}
              placeholder="Enter balloon callsign"
              disabled={!isAuthenticated}
            />
          </div>

          <div className="form-group">
            <label>Burst Detection Altitude (ft)</label>
            <input
              type="number"
              value={burstAltitudeInput}
              onChange={handleBurstAltitudeChange}
              placeholder="16404"
              disabled={!isAuthenticated}
            />
          </div>

          <div className="form-group">
            <label>Update Interval (ms)</label>
            <input
              type="number"
              value={config.updateInterval}
              onChange={(e) => {
                if (!requireAuth('modify update interval')) return;
                onUpdateConfig({ updateInterval: parseInt(e.target.value) });
              }}
              placeholder="30000"
              disabled={!isAuthenticated}
            />
          </div>

          <h3>KML Prediction Upload</h3>
          <div 
            {...getRootProps()} 
            className={`file-upload ${isDragActive ? 'dragover' : ''} ${!isAuthenticated ? 'disabled' : ''}`}
            style={{ opacity: isAuthenticated ? 1 : 0.5, pointerEvents: isAuthenticated ? 'auto' : 'none' }}
          >
            <input {...getInputProps()} />
            <Upload size={24} style={{ marginBottom: '10px', color: '#6c757d' }} />
            <div className="file-upload-text">
              {!isAuthenticated 
                ? 'Admin access required for KML upload'
                : isDragActive
                  ? 'Drop the KML file here...'
                  : 'Drag & drop a KML file, or click to select'
              }
            </div>
          </div>

          {trackingData.prediction && (
            <div className="prediction-metrics">
              <h4>Prediction Metrics</h4>
              {trackingData.prediction.metrics && (
                <>
                  <div className="data-row">
                    <span className="data-label">Distance:</span>
                    <span className="data-value">{formatDistance(trackingData.prediction.metrics.distance)}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Bearing:</span>
                    <span className="data-value">{formatBearing(trackingData.prediction.metrics.bearing)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <button 
            className="btn btn-danger" 
            onClick={() => {
              if (!requireAuth('reset tracking data')) return;
              onResetTracking();
            }}
            disabled={!isAuthenticated}
          >
            Reset Tracking Data
          </button>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="scrollable-content">
          <h3>Balloon Status</h3>
          
          {trackingData.balloon.current ? (
            <div className="data-display">
              <h4>Current Position</h4>
              <div className="data-row">
                <span className="data-label">Callsign:</span>
                <span className="data-value">{trackingData.balloon.current.callsign}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Altitude:</span>
                <span className="data-value">{formatAltitude(trackingData.balloon.current.altitude)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Speed:</span>
                <span className="data-value">
                  {trackingData.balloon.current.speed ? `${trackingData.balloon.current.speed} mph` : 'Unknown'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Course:</span>
                <span className="data-value">
                  {trackingData.balloon.current.course ? `${trackingData.balloon.current.course}°` : 'Unknown'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Last Update:</span>
                <span className="data-value">{formatTime(trackingData.balloon.current.timestamp)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Status:</span>
                <span className="data-value">
                  <span className={`status-indicator ${getStatusIndicator(trackingData.balloon.current.timestamp)}`}></span>
                  {getStatusIndicator(trackingData.balloon.current.timestamp) === 'status-online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ) : (
            <div className="data-display">
              <p>No balloon data available</p>
            </div>
          )}

          {trackingData.balloon.burstDetected && (
            <div className="burst-alert">
              <AlertTriangle size={16} style={{ marginRight: '5px' }} />
              <strong>BURST DETECTED!</strong>
              <div style={{ marginTop: '5px', fontSize: '11px' }}>
                Altitude: {formatAltitude(trackingData.balloon.actualBurstPoint?.altitude)}<br/>
                Time: {formatTime(trackingData.balloon.actualBurstPoint?.timestamp)}
              </div>
            </div>
          )}

          {trackingData.balloon.calculatedLanding && (
            <div className="landing-point">
              <CheckCircle size={16} style={{ marginRight: '5px' }} />
              <strong>Calculated Landing Point</strong>
              <div style={{ marginTop: '5px', fontSize: '11px' }}>
                Distance: {formatDistance(trackingData.balloon.calculatedLanding.predictionMetrics.distance)}<br/>
                Bearing: {formatBearing(trackingData.balloon.calculatedLanding.predictionMetrics.bearing)}<br/>
                Calculated: {formatTime(trackingData.balloon.calculatedLanding.calculatedAt)}
              </div>
            </div>
          )}

          <div className="data-display">
            <h4>Flight Statistics</h4>
            <div className="data-row">
              <span className="data-label">History Points:</span>
              <span className="data-value">{trackingData.balloon.history.length}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Last Update:</span>
              <span className="data-value">{formatTime(trackingData.lastUpdate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chasers Tab */}
      {activeTab === 'chasers' && (
        <div className="scrollable-content" style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
          <h3>Chaser Management</h3>
          
          <div className="form-group">
            <label>Add Chaser Callsign</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={newChaserCallsign}
                onChange={(e) => setNewChaserCallsign(e.target.value)}
                placeholder="Enter callsign"
                style={{ flex: 1, marginRight: '5px' }}
              />
              <button className="btn btn-success" onClick={handleAddChaser}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <h3>Current Chasers</h3>
          <div className="chaser-list">
            {config.chaserCallsigns && config.chaserCallsigns.length > 0 ? (
              config.chaserCallsigns.map((callsign) => {
                const chaserData = trackingData.chasers.find(c => c.callsign === callsign);
                return (
                  <div key={callsign} className="chaser-item">
                    <div>
                      <div className="chaser-callsign">{callsign}</div>
                      {chaserData && (
                        <div className="chaser-time">
                          {formatTime(chaserData.timestamp)} - {formatAltitude(chaserData.altitude)}
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      onClick={() => handleRemoveChaser(callsign)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#6c757d', fontSize: '12px' }}>No chasers configured</p>
            )}
          </div>

          {trackingData.chasers && trackingData.chasers.length > 0 && (
            <div className="data-display">
              <h4>Active Chasers</h4>
              {trackingData.chasers.map((chaser, index) => (
                <div key={index} className="chaser-item">
                  <div>
                    <div className="chaser-callsign">{chaser.callsign}</div>
                    <div className="chaser-time">
                      {formatTime(chaser.timestamp)} - {formatAltitude(chaser.altitude)}
                    </div>
                  </div>
                  <span className={`status-indicator ${getStatusIndicator(chaser.timestamp)}`}></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel; 
