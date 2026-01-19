#!/usr/bin/env node

/**
 * Simple HTTP Server for DroneSecure Frontend
 * 
 * This script starts a basic HTTP server to serve the frontend application.
 * Usage: node frontend/server.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 8000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query string
    filePath = filePath.split('?')[0];
    
    // Security: prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Build full file path
    const fullPath = path.join(PUBLIC_DIR, filePath);
    
    // Get file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
            }
            console.error(`Error serving ${filePath}:`, err.message);
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛸 DroneSecure Frontend Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n📁 Serving files from:`);
    console.log(`   ${PUBLIC_DIR}`);
    console.log(`\n💡 Instructions:`);
    console.log(`   1. Make sure MetaMask is installed`);
    console.log(`   2. Deploy the smart contract (npm run deploy:local)`);
    console.log(`   3. Update CONTRACT_ADDRESS in frontend/src/app.js`);
    console.log(`   4. Open http://localhost:${PORT} in your browser`);
    console.log(`   5. Connect your wallet and start using DroneSecure!`);
    console.log(`\n🛑 Press Ctrl+C to stop the server\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
