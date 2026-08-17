import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
import userRoutes from './routes/userRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
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

// Security Middlewares
app.use(helmet());

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

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // In development mode, allow any localhost or 127.0.0.1 origin
    if (process.env.NODE_ENV === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176'
    ];
    if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Setup static uploads folder directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/job-match', jobMatchRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
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

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

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

  // 2. Start Express app server after DB is ready
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
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
