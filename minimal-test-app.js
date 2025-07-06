const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Minimal test app is working!',
    timestamp: new Date().toISOString(),
    directory: process.cwd(),
    nodeVersion: process.version,
    pid: process.pid
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Minimal test app running on port ${PORT}`);
  console.log(`Directory: ${process.cwd()}`);
  console.log(`Node version: ${process.version}`);
});

module.exports = app; 