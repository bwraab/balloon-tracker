# Static Version Plan

## Overview
Convert the balloon tracker to a static website that works on any shared hosting without Node.js.

## Architecture:
1. **Frontend Only** - Pure HTML/CSS/JavaScript
2. **External Backend** - Use free services for API
3. **Client-Side Processing** - Handle KML parsing in browser

## Implementation Steps:

### 1. Create Static Frontend
- Remove all Node.js dependencies
- Use vanilla JavaScript or lightweight frameworks
- Handle KML file parsing in browser
- Use browser's fetch API for APRS data

### 2. Backend Options:
**Option A: Railway/Render/Vercel**
- Deploy Node.js backend to free tier
- Frontend calls external API
- CORS configuration needed

**Option B: Pure Client-Side**
- Direct APRS.fi API calls from browser
- Local storage for configuration
- No server-side processing

**Option C: GitHub Pages + Netlify Functions**
- Static site on GitHub Pages
- Serverless functions for API calls
- Free tier available

### 3. Benefits:
- Works on any shared hosting
- No server configuration needed
- Can be hosted anywhere
- Lower resource usage

### 4. Limitations:
- No real-time updates (polling only)
- Limited by browser CORS policies
- No server-side data persistence
- APRS API rate limits apply

## Would you like me to:
1. Create the static version?
2. Help you check your hosting provider's Node.js support?
3. Set up a free backend service? 