# Directory Restrictions Testing Guide

## The Problem
Your observation about Python restrictions is very insightful! Many shared hosting providers have strict limitations on where you can execute applications. This could explain why Passenger fails to start your Node.js app even though it works manually.

## Testing Strategy

### 1. Test Current Directory Permissions
Upload and run the test script to check your current directory:

```bash
node test-directory-restrictions.js
```

### 2. Test Different Directory Locations

#### Option A: Home Directory Root
Try moving your app to your home directory root (usually `/home/username/` or `/public_html/`):

1. Create a new directory in your home root: `mkdir ~/node-test`
2. Copy the minimal test files there:
   - `minimal-test-app.js`
   - `minimal-test-package.json` (rename to `package.json`)
3. Install dependencies: `npm install`
4. Test manually: `node minimal-test-app.js`
5. If manual test works, try with Passenger

#### Option B: Public HTML Directory
Try in your public HTML directory (usually `/public_html/` or `/home/username/public_html/`):

1. Create: `mkdir public_html/node-test`
2. Copy test files there
3. Test both manual and Passenger execution

#### Option C: Subdirectory of Public HTML
Try in a subdirectory of public_html:
1. Create: `mkdir public_html/apps/node-test`
2. Copy test files there
3. Test both manual and Passenger execution

### 3. Check File Permissions
Ensure files have correct permissions:
```bash
chmod 755 minimal-test-app.js
chmod 644 package.json
chmod 755 node_modules
```

### 4. Test with Different .htaccess Configurations

#### Minimal .htaccess for Testing
```apache
PassengerNodejs /opt/alt/alt-nodejs22/root/usr/bin/node
PassengerAppRoot /path/to/your/test/directory
PassengerAppType node
PassengerStartupFile minimal-test-app.js
```

#### Alternative: Use Passenger.json
Create a `Passenger.json` file in your test directory:
```json
{
  "app_type": "node",
  "startup_file": "minimal-test-app.js",
  "node_path": "/opt/alt/alt-nodejs22/root/usr/bin/node"
}
```

### 5. Check Hosting Provider Documentation
Look for:
- Allowed Node.js directories
- Passenger configuration requirements
- File permission requirements
- Directory structure restrictions

## Common Solutions

### If Directory Restrictions Are the Issue:

1. **Move to Allowed Directory**: Contact your hosting provider to find out which directories allow Node.js execution

2. **Use Subdomain**: Create a subdomain that points to an allowed directory

3. **Use Different Hosting**: Consider VPS hosting where you have full control

4. **Static Site Alternative**: Convert to a static site with client-side JavaScript

### Alternative Approaches:

1. **Cron Job**: Run your Node.js app via cron job and serve static files
2. **External API**: Host the API elsewhere and serve only the frontend
3. **Serverless**: Use serverless functions for the API

## Testing Steps

1. **Upload test files** to different locations
2. **Test manual execution** in each location
3. **Test Passenger execution** in each location
4. **Check error logs** for each attempt
5. **Document results** to identify patterns

## Expected Results

- **If directory restrictions are the issue**: Manual execution will work in some directories but Passenger will fail in all directories
- **If it's a Passenger configuration issue**: Manual execution will work everywhere but Passenger will fail everywhere
- **If it's a permissions issue**: Both manual and Passenger will fail with permission errors

## Next Steps

1. Run the directory test script
2. Try the minimal test app in different locations
3. Document which locations work for manual execution
4. Test Passenger in the locations that work manually
5. Contact hosting provider with your findings 