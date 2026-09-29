/**
 * Database Connectivity Verification Script
 *
 * Verifies the MongoDB Atlas connection defined in MONGODB_URI.
 * Does NOT seed any data. Does NOT create demo or fake users.
 *
 * Usage (from apps/api/):
 *   npm run seed
 */
import { connectDatabase } from '../database';

async function verifyConnection() {
  console.log('====================================================');
  console.log('🔍 AgriN — MongoDB Atlas Connection Verification');
  console.log('====================================================');

  try {
    await connectDatabase();
    console.log('');
    console.log('✅ Connection verified. MongoDB Atlas is reachable.');
    console.log('   Collections (users, farms) are auto-created on first use.');
    console.log('');
    console.log('   To create your first account, go to:');
    console.log('   http://localhost:5173/register');
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('');
    console.error('❌ Connection FAILED.');
    console.error(`   ${err?.message || err}`);
    console.error('');
    console.error('   Fix checklist:');
    console.error('   1. MONGODB_URI is set correctly in .env');
    console.error('   2. Your IP is on the Atlas allowlist (Network Access → Add IP)');
    console.error('   3. DB username/password are correct');
    console.error('====================================================');
    process.exit(1);
  }
}

verifyConnection();
