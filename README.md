# Balloon Tracker

A comprehensive web application for tracking high-altitude weather balloons using APRS (Automatic Packet Reporting System) with intelligent landing point prediction.

## Features

- **Real-time APRS Tracking**: Live tracking of balloon and chaser positions via APRS.fi API
- **KML Prediction Integration**: Upload and overlay flight predictions from ppredictor
- **Intelligent Landing Calculation**: Automatically calculates new landing points when burst is detected
- **Burst Detection**: Automatic detection of balloon burst based on altitude changes
- **Chaser Tracking**: Track multiple chaser vehicles simultaneously
- **Interactive Map**: Real-time map display with flight paths, markers, and search areas
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- APRS.fi API key (free registration at https://aprs.fi/)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd balloontrack
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   APRS_API_KEY=your_aprs_api_key_here
   PORT=3001
   ```

5. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

## Usage

### Starting the Application

1. **Start the server**
   ```bash
   npm start
   ```

2. **Access the application**
   Open your browser and navigate to `http://localhost:3001`

### Configuration

1. **Set Balloon Callsign**
   - Open the control panel (gear icon)
   - Enter your balloon's APRS callsign
   - The system will automatically start tracking

2. **Add Chaser Callsigns**
   - Go to the "Chasers" tab in the control panel
   - Add callsigns for vehicles chasing the balloon
   - Each chaser will appear on the map with their current position

3. **Upload KML Prediction**
   - Go to the "Configuration" tab
   - Drag and drop your ppredictor KML file
   - The prediction path, burst point, and landing point will be displayed

### Tracking Features

- **Real-time Updates**: Data updates every 30 seconds automatically
- **Flight Path**: Balloon's complete flight path is displayed as a red line
- **Prediction Overlay**: Predicted flight path shown as a blue dashed line
- **Burst Detection**: Automatically detects when balloon bursts (below 5km altitude)
- **Landing Calculation**: When burst is detected, calculates new landing point using prediction metrics

### Map Interface

- **Balloon Marker**: Red balloon icon showing current position
- **Chaser Markers**: Blue star icons for each chaser
- **Burst Point**: Orange burst icon for actual burst location
- **Landing Points**: Green landing icons for predicted and calculated landing sites
- **Search Radius**: Green circle around calculated landing point (5km radius)

## API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration
- `PUT /api/config/balloon-callsign` - Set balloon callsign
- `POST /api/config/chaser-callsigns` - Add chaser callsign
- `DELETE /api/config/chaser-callsigns/:callsign` - Remove chaser callsign

### Tracking
- `GET /api/tracking` - Get current tracking data
- `POST /api/tracking/reset` - Reset tracking data
- `GET /api/tracking/balloon/history` - Get balloon flight history
- `GET /api/tracking/chasers` - Get chaser data
- `GET /api/tracking/prediction` - Get prediction data
- `GET /api/tracking/burst` - Get burst information

### KML Processing
- `POST /api/kml/upload` - Upload KML prediction file
- `POST /api/kml/content` - Upload KML content directly
- `GET /api/kml` - Get current prediction data
- `POST /api/kml/calculate-metrics` - Calculate prediction metrics
- `POST /api/kml/calculate-landing` - Calculate new landing point
- `DELETE /api/kml` - Clear prediction data

## Technical Details

### Backend Architecture
- **Express.js**: Web server and API framework
- **Socket.IO**: Real-time communication
- **APRS.fi API**: Balloon and chaser position data
- **KML Parser**: XML parsing for prediction files
- **Geographic Calculations**: Distance, bearing, and destination point calculations

### Frontend Architecture
- **React**: User interface framework
- **Leaflet**: Interactive mapping
- **Socket.IO Client**: Real-time updates
- **React Dropzone**: File upload interface
- **Lucide React**: Icon library

### Key Algorithms

#### Landing Point Calculation
1. Calculate distance and bearing between predicted burst and landing points
2. When actual burst is detected, apply the same distance and bearing from actual burst location
3. Result provides highly accurate landing prediction

#### Burst Detection
- Monitors altitude changes
- Detects burst when altitude drops below threshold (default: 5km)
- Confirms burst with descending altitude pattern

## Configuration Options

- **Burst Detection Altitude**: Altitude threshold for burst detection (default: 5000m)
- **Update Interval**: How often to fetch new APRS data (default: 30 seconds)
- **Max History Length**: Maximum number of historical points to keep (default: 1000)

## Troubleshooting

### Common Issues

1. **No balloon data appearing**
   - Verify APRS API key is set correctly
   - Check balloon callsign is correct
   - Ensure balloon is transmitting APRS data

2. **KML file not loading**
   - Verify file is valid KML format
   - Check file size (max 10MB)
   - Ensure file contains burst and landing point placemarks

3. **Chasers not appearing**
   - Verify chaser callsigns are correct
   - Check chasers are transmitting APRS data
   - Ensure chasers are within APRS.fi coverage area

### Getting APRS API Key

1. Go to https://aprs.fi/
2. Create a free account
3. Go to your account settings
4. Generate an API key
5. Add the key to your `.env` file

## Development

### Running in Development Mode

1. **Start backend in development mode**
   ```bash
   npm run dev
   ```

2. **Start frontend in development mode**
   ```bash
   cd client
   npm start
   ```

3. **Access frontend**
   Navigate to `http://localhost:3000`

### Project Structure
```
balloontrack/
├── server.js              # Main server file
├── services/              # Backend services
│   ├── aprsService.js     # APRS data fetching
│   ├── kmlService.js      # KML parsing and calculations
│   ├── trackingService.js # Real-time tracking logic
│   └── configService.js   # Configuration management
├── routes/                # API routes
│   ├── config.js          # Configuration endpoints
│   ├── tracking.js        # Tracking endpoints
│   └── kml.js            # KML processing endpoints
├── client/                # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── components/    # React components
│   │   └── index.js       # React entry point
│   └── public/            # Static assets
└── data/                  # Configuration storage
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Happy Balloon Tracking! 🎈** 