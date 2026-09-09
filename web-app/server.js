import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

function serveStatic(req, res) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  let pathname = parsedUrl.pathname;
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(__dirname, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// 1. HTTP Server (Port 3000)
const HTTP_PORT = 3000;
const httpServer = http.createServer(serveStatic);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`[HTTP]  Vision AI live at: http://localhost:${HTTP_PORT}`);
  console.log(`[HTTP]  Local Network:    http://192.168.55.108:${HTTP_PORT}`);
});

// 2. HTTPS Server (Port 3443 for mobile camera security)
const HTTPS_PORT = 3443;
try {
  const keyPath = path.join(__dirname, 'key.pem');
  const certPath = path.join(__dirname, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    const httpsServer = https.createServer(options, serveStatic);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`[HTTPS] Mobile Camera Live at: https://192.168.55.108:${HTTPS_PORT}`);
      console.log(`[HTTPS] Localhost:            https://localhost:${HTTPS_PORT}`);
    });
  }
} catch (sslErr) {
  console.warn('HTTPS setup skipped:', sslErr.message);
}
