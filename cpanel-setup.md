# Balloon Tracker - cPanel Hosting Setup

## Overview
This guide will help you deploy the balloon tracker on a cPanel hosting account. The application will be modified to work as a web service rather than a standalone server.

## Prerequisites
- cPanel hosting account with Node.js support
- SSH access (recommended) or cPanel Terminal
- APRS.fi API key

## Step 1: Prepare Your Local Files

### Option A: Upload via cPanel File Manager
1. **Zip your project:**
   - Select all files in your `balloontrack` folder
   - Create a ZIP file named `balloon-tracker.zip`

2. **Upload to cPanel:**
   - Log into cPanel
   - Go to File Manager
   - Navigate to your domain's root directory (usually `public_html`)
   - Upload `balloon-tracker.zip`
   - Extract the ZIP file

### Option B: Upload via Git (if available)
```bash
# In your local project folder
git init
git add .
git commit -m "Initial commit"
# Then push to your hosting provider's Git repository
```

## Step 2: Configure for cPanel

### Create Application Configuration
Create a file called `app.js` in your root directory:

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import our modules
const aprsService = require('./services/aprsService');
const kmlService = require('./services/kmlService');
const trackingService = require('./services/trackingService');
const configService = require('./services/configService');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/kml', require('./routes/kml'));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start tracking service (without Socket.IO for cPanel)
trackingService.startTrackingForCpanel();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Balloon Tracker running on port ${PORT}`);
});

module.exports = app;
```

### Modify Tracking Service for cPanel
Update `services/trackingService.js` to work without Socket.IO:

```javascript
// Add this method to the TrackingService class
startTrackingForCpanel() {
  // Update tracking data every 30 seconds without Socket.IO
  setInterval(async () => {
    await this.updateTrackingData();
  }, 30000);
}

// Modify updateTrackingData method
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

  } catch (error) {
    console.error('Error updating tracking data:', error);
  }
}
```

## Step 3: Set Up Environment Variables

### Option A: Using cPanel Environment Variables
1. In cPanel, go to "Software" → "Setup Node.js App"
2. Create a new Node.js application
3. Set environment variables:
   - `APRS_API_KEY`: Your APRS API key
   - `NODE_ENV`: `production`

### Option B: Using .env file
Create a `.env` file in your root directory:
```env
APRS_API_KEY=your_aprs_api_key_here
NODE_ENV=production
PORT=3000
```

## Step 4: Install Dependencies

### Via SSH (Recommended)
```bash
# Connect to your server via SSH
ssh username@yourdomain.com

# Navigate to your application directory
cd public_html/balloon-tracker

# Install dependencies
npm install --production

# Build the frontend
cd client
npm install --production
npm run build
cd ..
```

### Via cPanel Terminal
1. Go to cPanel → "Advanced" → "Terminal"
2. Navigate to your application directory
3. Run the same commands as above

## Step 5: Configure Node.js App in cPanel

1. **Go to cPanel → Software → Setup Node.js App**
2. **Create New Application:**
   - Node.js version: 16.x or higher
   - Application mode: Production
   - Application root: `/home/username/public_html/balloon-tracker`
   - Application URL: `yourdomain.com/balloon-tracker`
   - Application startup file: `app.js`
   - Passenger port: 3000

3. **Set Environment Variables:**
   - `APRS_API_KEY`: Your APRS API key
   - `NODE_ENV`: `production`

4. **Start the Application**

## Step 6: Configure Domain/Subdomain

### Option A: Subdomain
1. Create a subdomain like `balloon.yourdomain.com`
2. Point it to your application directory
3. Access via: `https://balloon.yourdomain.com`

### Option B: Subdirectory
1. Access via: `https://yourdomain.com/balloon-tracker`

## Step 7: Update Frontend for cPanel

Modify `client/src/App.js` to work without Socket.IO:

```javascript
// Remove Socket.IO imports and replace with polling
useEffect(() => {
  // Poll for updates every 30 seconds instead of using Socket.IO
  const interval = setInterval(() => {
    loadTrackingData();
  }, 30000);

  // Load initial data
  loadTrackingData();
  loadConfig();

  return () => clearInterval(interval);
}, []);

// Remove socket-related code
```

## Step 8: Test Your Application

1. **Access your application:**
   - If subdomain: `https://balloon.yourdomain.com`
   - If subdirectory: `https://yourdomain.com/balloon-tracker`

2. **Configure the tracker:**
   - Enter balloon callsign
   - Add chaser callsigns
   - Upload KML prediction file

## Troubleshooting

### Common Issues:

1. **"Module not found" errors:**
   - Make sure all dependencies are installed
   - Check Node.js version compatibility

2. **"Permission denied" errors:**
   - Check file permissions (should be 644 for files, 755 for directories)
   - Ensure Node.js app has proper permissions

3. **"Port already in use":**
   - Change the port in your `.env` file
   - Update cPanel Node.js app configuration

4. **"Cannot find module" errors:**
   - Make sure you're in the correct directory
   - Run `npm install` again

### File Permissions:
```bash
# Set proper permissions
chmod 644 *.js
chmod 644 .env
chmod 755 services/
chmod 755 routes/
chmod 755 client/build/
```

## Alternative: Static Site Approach

If Node.js hosting isn't available, you can create a static version:

1. **Build the frontend locally:**
   ```bash
   cd client
   npm run build
   ```

2. **Upload only the `client/build` folder to your web server**

3. **Use a different backend service** (like Heroku, Railway, or Vercel) for the API

4. **Update the API endpoints** in the frontend to point to your backend service

## Support

If you encounter issues:
1. Check cPanel error logs
2. Verify Node.js version compatibility
3. Ensure all environment variables are set
4. Check file permissions

Your balloon tracker should now be accessible via your website! 