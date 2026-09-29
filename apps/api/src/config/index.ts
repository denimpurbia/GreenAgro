import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// Load .env reliably from project/workspace locations
// ─────────────────────────────────────────────────────────────────────────────

const candidateEnvPaths = [
  // Monorepo root
  path.resolve(process.cwd(), '../../.env'),

  // apps/.env
  path.resolve(process.cwd(), '../.env'),

  // Current working directory
  path.resolve(process.cwd(), '.env'),

  // Based on compiled/source file location
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '../../../.env')
    : '',
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '../../.env')
    : '',
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '../.env')
    : '',
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '.env')
    : '',
].filter(Boolean);

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({
      path: envPath,
      override: false,
    });

    console.log(`[Config] Loaded environment from: ${envPath}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  port: parseInt(process.env.PORT || '5000', 10) || 5000,

  nodeEnv: process.env.NODE_ENV || 'development',

  jwtSecret:
    process.env.JWT_SECRET ||
    'agrin_saarthi_super_secure_jwt_secret_dev_key_2026',

  mongodbUri: process.env.MONGODB_URI || '',

  useInMemoryDb:
    process.env.USE_IN_MEMORY_DB === 'true',

  // ───────────────────────────────────────────────────────────────────────────
  // Gemini
  // ───────────────────────────────────────────────────────────────────────────

  get geminiApiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  },

  get geminiModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Weather
  // ───────────────────────────────────────────────────────────────────────────

  get weatherProvider(): string {
    return (
      process.env.WEATHER_PROVIDER ||
      'open-meteo'
    ).trim().toLowerCase();
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Satellite
  //
  // IMPORTANT:
  // No fake/demo satellite data.
  // If SATELLITE_PROVIDER is not explicitly configured,
  // Earth Engine is used as the intended real provider.
  // ───────────────────────────────────────────────────────────────────────────

  get satelliteProvider(): string {
    return (
      process.env.SATELLITE_PROVIDER ||
      'earth-engine'
    ).trim().toLowerCase();
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Disease
  // ───────────────────────────────────────────────────────────────────────────

  get diseaseProvider(): string {
    return (
      process.env.DISEASE_PROVIDER ||
      'gemini'
    ).trim().toLowerCase();
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Google OAuth
  // ───────────────────────────────────────────────────────────────────────────

  get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  },

  get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },

  get googleRedirectUri(): string {
    if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim()) {
      return process.env.GOOGLE_CALLBACK_URL.trim();
    }
    if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
      return process.env.GOOGLE_REDIRECT_URI.trim();
    }
    if (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) {
      const base = process.env.BACKEND_URL.trim().replace(/\/+$/, '');
      return `${base}/api/auth/google/callback`;
    }
    // Automatically detect Vercel production or preview host URL
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${host}/api/auth/google/callback`;
    }
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim()) {
      const host = process.env.VERCEL_URL.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${host}/api/auth/google/callback`;
    }
    return 'http://localhost:5000/api/auth/google/callback';
  },

  get frontendUrl(): string {
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
      return process.env.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '');
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${host}`;
    }
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim()) {
      const host = process.env.VERCEL_URL.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${host}`;
    }
    return 'http://localhost:3000';
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Safe startup diagnostics
// NEVER print secrets/private keys.
// ─────────────────────────────────────────────────────────────────────────────

console.log('[Config] Environment:', config.nodeEnv);
console.log('[Config] Satellite provider:', config.satelliteProvider);
console.log(
  '[Config] Earth Engine project:',
  process.env.EARTH_ENGINE_PROJECT
    ? 'configured'
    : 'missing'
);
console.log(
  '[Config] Earth Engine credentials:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.EARTH_ENGINE_CREDENTIALS_JSON
    ? 'configured'
    : 'missing'
);