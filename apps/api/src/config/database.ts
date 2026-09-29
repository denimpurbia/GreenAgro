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

export async function connectDatabase(): Promise<boolean> {
  // Explicit development option: Only when explicitly true may in-memory be used
  if (config.useInMemoryDb) {
    console.log('Database: In-memory mode active (USE_IN_MEMORY_DB=true).');
    console.log('   This mode is for local development only. No data is persisted.');
    isConnectedToDb = false;
    return false;
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
    console.log('Connecting to MongoDB Atlas...');
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isConnectedToDb = true;
    console.log('MongoDB Atlas connected successfully.');
    return true;
  } catch (err: any) {
    isConnectedToDb = false;
    // Sanitize any potential credentials from error message before logging
    const safeError = err?.message ? String(err.message).replace(/:[^@\s/]+@/, ':***@') : 'Unknown error';
    console.error('MongoDB Atlas connection failed. Server will not start.');
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
