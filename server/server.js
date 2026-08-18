import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Import config
import connectDB from './config/db.js';
import seedInitialAdmin from './utils/seedAdmin.js';

// Import custom middleware
import { loggerMiddleware } from './middleware/loggerMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import jobMatchRoutes from './routes/jobMatch.routes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables (from server/.env and root .env)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';

// Trust reverse proxy (Render, AWS, Nginx) so secure cookies & HTTPS headers work
app.set('trust proxy', 1);

// Security Middlewares (relax CSP/COEP so Vite assets, Google Fonts, and charts load cleanly)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Performance Compression (gzip)
app.use(compression());

// Request Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Morgan HTTP request logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request file logger middleware (appends to logs/access.log)
app.use(loggerMiddleware);

// Helper to parse allowed origins list
const parseAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
  ];

  if (process.env.CORS_ORIGIN) {
    const custom = process.env.CORS_ORIGIN.split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    origins.push(...custom);
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    origins.push(process.env.RENDER_EXTERNAL_URL.trim().replace(/\/+$/, ''));
  }

  return [...new Set(origins)];
};

const allowedOrigins = parseAllowedOrigins();

// Configure CORS for single-origin production, separate frontend static sites, and local development
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin browser requests, curl, mobile apps, postman)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Allow localhost/127.0.0.1 in non-production or for local development
    if (
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // Allow explicitly listed origins (from CORS_ORIGIN or RENDER_EXTERNAL_URL)
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow deployed Render domains (*.onrender.com)
    if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // If no CORS_ORIGIN is explicitly set, allow the requesting origin safely
    if (!process.env.CORS_ORIGIN) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204
};

// Apply CORS to all routes and handle preflight OPTIONS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Setup static uploads folder directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/job-match', jobMatchRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Health check endpoints (both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateLabels = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.status(200).json({
    status: 'OK',
    message: 'AI Resume Analyzer API is running smoothly',
    database: stateLabels[dbState] || 'Unknown',
    uptime: `${process.uptime().toFixed(1)}s`,
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Serve client static assets and configure React SPA fallback
const clientDistPath = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  // Serve static assets from Vite build
  app.use(express.static(clientDistPath));

  // Catch-all route to serve React's index.html for client-side SPA routing (page refresh)
  app.get('*', (req, res, next) => {
    // If request is for an unhandled /api or /uploads path, pass to 404 handler
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Fallback root message when frontend is not yet built
  app.get('/', (req, res) => {
    res.send('AI Resume Analyzer API is running. (Build client to serve frontend from root)');
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Global startup handlers for uncaught issues
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down server...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED PROMISE REJECTION! Shutting down server...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

let portRetryAttempts = {};

const startServer = async (port) => {
  try {
    // 1. Connect to database before listening to requests
    await connectDB();
    // 2. Ensure initial administrator exists
    await seedInitialAdmin();
  } catch (err) {
    console.error('💥 Server startup aborted due to database connection error:', err.message);
    process.exit(1);
  }

  // 2. Start Express app server after DB is ready, listening on 0.0.0.0
  const server = app.listen(port, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is already in use.`);
      
      const attempts = portRetryAttempts[port] || 0;
      if (attempts < 1) {
        portRetryAttempts[port] = attempts + 1;
        console.log(`🔄 Retrying port ${port} in 1000ms...`);
        setTimeout(() => startServer(port), 1000);
        return;
      }

      const nextPort = Number(port) + 1;
      console.log(`🔄 Retrying on next available port: ${nextPort}`);
      startServer(nextPort);
    } else {
      console.error('💥 Server startup error:', err);
    }
  });
};

startServer(PORT);

export default app;
