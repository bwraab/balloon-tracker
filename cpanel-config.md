# cPanel Configuration Fix

## Issues Fixed:
1. **HTTPS URLs**: Browser was trying to load resources over HTTPS instead of HTTP
2. **Wrong paths**: Static files were being requested from root instead of `/balloon-tracker`

## Steps to Fix:

### 1. Set Environment Variable in cPanel
In your cPanel Node.js app settings, add this environment variable:
```
BASE_PATH=/balloon-tracker
```

### 2. Update .htaccess (Already Done)
The .htaccess file has been updated to:
- Handle static files properly
- Force HTTP instead of HTTPS
- Proxy only necessary requests to Node.js

### 3. Restart Your Node.js App
1. Go to cPanel → Software → Setup Node.js App
2. Stop your app
3. Start your app again

### 4. Test the Fix
After restarting, test these URLs:
- `http://n4bwr.com/balloon-tracker/` (should show the app)
- `http://n4bwr.com/balloon-tracker/api/health` (should return JSON)
- `http://n4bwr.com/balloon-tracker/static/css/main.74392723.css` (should load CSS)

## What Changed:

### app.js
- Added `BASE_PATH` environment variable support
- Updated all routes to use the base path
- Fixed static file serving paths
- Added explicit routes for manifest.json and other static files

### .htaccess
- Changed from proxying everything to handling static files locally
- Only proxy API and app requests to Node.js
- Removed HTTPS forcing

## If You Still See HTTPS URLs:
The browser might be caching the old URLs. Try:
1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Open in incognito/private mode

## Alternative: Force HTTP in Browser
If your browser keeps redirecting to HTTPS, you can:
1. Type `http://` explicitly in the URL
2. Or add this to your .htaccess:
```apache
# Force HTTP
RewriteCond %{HTTPS} on
RewriteRule ^(.*)$ http://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

## Expected Result:
- App loads at `http://n4bwr.com/balloon-tracker/`
- All static files load correctly
- No more 404 errors for CSS/JS files
- No more HTTPS redirect issues 