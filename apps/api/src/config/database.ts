import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './index';

// Fix Node.js DNS SRV resolution on Windows environments where local DNS refuses SRV queries
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if custom DNS cannot be configured
}

export let isConnectedToDb = false;

// Serverless-safe cached connection promise to prevent duplicate connections across cold/warm invocations
let cachedConnectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<boolean> {
  // Explicit development option: Only when explicitly true may in-memory be used
  if (config.useInMemoryDb) {
    console.log('Database: In-memory mode active (USE_IN_MEMORY_DB=true).');
    console.log('   This mode is for local development only. No data is persisted.');
    isConnectedToDb = false;
    return false;
  }

  // If already connected (readyState === 1), reuse the existing pooled connection immediately
  if (mongoose.connection.readyState === 1) {
    isConnectedToDb = true;
    return true;
  }

  // If connection is in progress (readyState === 2), wait for existing connection promise
  if (cachedConnectionPromise && (mongoose.connection.readyState as number) === 2) {
    try {
      await cachedConnectionPromise;
      isConnectedToDb = (mongoose.connection.readyState as number) === 1;
      return isConnectedToDb;
    } catch {
      cachedConnectionPromise = null;
    }
  }

  // When USE_IN_MEMORY_DB=false, require a successful MongoDB connection
  const uri = config.mongodbUri;
  const isPlaceholder =
    !uri ||
    uri === 'mongodb+srv://' ||
    uri.trim() === '';

  if (isPlaceholder) {
    console.error('MongoDB Atlas connection failed. Server will not start.');
    console.error('Reason: MONGODB_URI is not set or is empty in .env');
    isConnectedToDb = false;
    throw new Error('MONGODB_URI is not configured. Server will not start.');
  }

  try {
    console.log('Connecting to MongoDB Atlas (serverless-safe connection pool)...');
    mongoose.set('strictQuery', false);

    cachedConnectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    await cachedConnectionPromise;
    isConnectedToDb = true;
    console.log('MongoDB Atlas connected successfully.');
    return true;
  } catch (err: any) {
    cachedConnectionPromise = null;
    isConnectedToDb = false;
    // Sanitize any potential credentials from error message before logging
    const safeError = err?.message ? String(err.message).replace(/:[^@\s/]+@/, ':***@') : 'Unknown error';
    console.error('MongoDB Atlas connection failed.');
    console.error(`Reason: ${safeError}`);
    // Fail startup / re-throw without fallback
    throw err;
  }
}

// Runtime events
mongoose.connection.on('error', (err) => {
  const safeMsg = err?.message ? String(err.message).replace(/:[^@\s/]+@/, ':***@') : String(err);
  console.error('MongoDB runtime error:', safeMsg);
  isConnectedToDb = false;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
  isConnectedToDb = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB Atlas connected successfully.');
  isConnectedToDb = true;
});
