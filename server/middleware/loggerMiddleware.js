import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream (in append mode)
const logStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

/**
 * Custom request logger middleware.
 * Logs HTTP method, URL, status code, IP address, and execution duration.
 */
export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}\n`;
    
    // Write to file
    logStream.write(logLine);
  });

  next();
};
