#!/usr/bin/env node

console.log('=== Directory Restrictions Test ===');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Process ID:', process.pid);
console.log('User ID:', process.getuid ? process.getuid() : 'N/A');
console.log('Group ID:', process.getgid ? process.getgid() : 'N/A');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Test if we can read files
const fs = require('fs');
try {
  const files = fs.readdirSync('.');
  console.log('Files in current directory:', files.length);
} catch (error) {
  console.log('Error reading directory:', error.message);
}

// Test if we can write files
try {
  fs.writeFileSync('test-write.txt', 'test');
  fs.unlinkSync('test-write.txt');
  console.log('File write/delete test: PASSED');
} catch (error) {
  console.log('File write/delete test: FAILED -', error.message);
}

// Test if we can require modules
try {
  const path = require('path');
  console.log('Module require test: PASSED');
} catch (error) {
  console.log('Module require test: FAILED -', error.message);
}

console.log('=== Test Complete ==='); 