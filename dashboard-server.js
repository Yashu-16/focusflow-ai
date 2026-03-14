// Simple Node.js HTTP server - serves the dashboard HTML
// No npm install needed, uses only built-in Node.js modules
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HTML_FILE = path.join(__dirname, 'dashboard-standalone.html');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve the dashboard
  fs.readFile(HTML_FILE, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: dashboard-standalone.html not found. Make sure it is in the same folder as this file.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n[ERROR] Port 3000 is already in use.');
    console.error('Solution: Close the other app using port 3000, or open dashboard-standalone.html directly.\n');
  } else {
    console.error('[ERROR]', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n==========================================');
  console.log('  Dashboard running at http://localhost:3000');
  console.log('  Press Ctrl+C to stop');
  console.log('==========================================\n');
});
