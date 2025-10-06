import express from 'express';
import { config } from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import clipboardRoutes from './routes/clipboard.js';
import toolsRoutes from './routes/tools.js';
import filesRoutes from './routes/files.js';
import schedulerRoutes from './routes/scheduler.js';
import mediumExtractRoutes from './routes/mediumExtractor.js'
import notesRoutes from './routes/notes.js';
import authRoutes from './routes/auth.js';
// import subscriptionRoutes from './routes/subscription.js';
import healthRoutes from './routes/health.js';
import metricsRoutes from './routes/metrics.js';
import { setupSwagger } from './config/swagger.js';
import passport from './config/passport.js';
import cookieParser from "cookie-parser";
// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8080;

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

// Connect to MongoDB
connectDB();

// Trust proxy (for deployment platforms)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow for API usage
    crossOriginEmbedderPolicy: false,
  })
);
const allowedOrigins = [process.env.CORS_ORIGIN_DEVELOPMENT,  
  process.env.CORS_ORIGIN_PRODUCTION];
// CORS
app.use(
  cors({
    // origin: function (origin, callback) {
    //   if (!origin || allowedOrigins.includes(origin)) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing and compression
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Initialize Passport
app.use(passport.initialize());

// Request logging
app.use(pinoHttp({ logger }));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/subscription', subscriptionRoutes);
app.use('/api/clipboard', clipboardRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/extract-medium', mediumExtractRoutes);
app.use('/healthz', healthRoutes);
app.use('/metrics', metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Online Tools API',
    version: '1.0.0',
    status: 'running',
    documentation: '/docs',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});
// Clear cache endpoint (for development)

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API documentation available at http://localhost:${PORT}/docs`);
  logger.info(`🏥 Health check available at http://localhost:${PORT}/healthz`);
});

export default app;
