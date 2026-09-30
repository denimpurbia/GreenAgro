import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { config } from './config';
import { connectDatabase } from './database';

export const app = express();

// Configure CORS for frontend access
const parseAllowedOrigins = (): string[] => {
  const configured = (process.env.FRONTEND_URL || config.frontendUrl || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const defaults = [
    'https://green-agro-ruby.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  return Array.from(new Set([...defaults, ...configured]));
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, serverless invocations, or health probes)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isVercelDomain = /^https:\/\/[a-z0-9_-]+\.vercel\.app$/i.test(normalizedOrigin);

    if (
      allowedOrigins.includes(normalizedOrigin) ||
      isVercelDomain
    ) {
      return callback(null, true);
    } else {
      console.warn(`[CORS] Origin rejected: ${origin}`);
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Accept',
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight across all routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure database connection in serverless / container environments
app.use(async (_req, _res, next) => {
  try {
    await connectDatabase();
  } catch {
    // Database errors will be handled gracefully by individual route handlers
  }
  next();
});

// Health check aliases
app.get('/health', (_req, res) => {
  res.redirect('/api/health');
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'GreenAgro / AgriN Intelligence Network API',
    health: '/api/health',
  });
});

// Mount API routes under /api and root
app.use('/api', apiRouter);
app.use(apiRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

export default app;
