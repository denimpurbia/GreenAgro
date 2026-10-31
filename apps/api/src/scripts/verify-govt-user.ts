/**
 * GreenAgro CLI Admin Tool — Verify or Reject Government / Organization Accounts
 * Usage:
 *   npm run verify-admin --workspace=apps/api -- <email> [verified|rejected|suspended] [notes]
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../database';
import { UserModel } from '../models/User';
import { UserFarmService } from '../services/db/userFarmService';

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.toLowerCase().trim();
  const statusArg = (args[1] || 'verified').toLowerCase().trim() as 'verified' | 'rejected' | 'suspended';
  const notes = args.slice(2).join(' ') || 'Verified via CLI operator tool';

  if (!email) {
    console.log('Usage: npm run verify-admin --workspace=apps/api -- <email> [verified|rejected|suspended] [notes]');
    process.exit(1);
  }

  if (!['verified', 'rejected', 'suspended'].includes(statusArg)) {
    console.error('Invalid status. Must be one of: verified, rejected, suspended');
    process.exit(1);
  }

  await connectDatabase();

  const userDoc = await UserModel.findOne({ email });
  if (!userDoc) {
    console.error(`User not found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  userDoc.role = 'govt_org';
  userDoc.accountStatus = statusArg;
  userDoc.verifiedBy = 'CLI_OPERATOR';
  userDoc.verifiedAt = new Date();
  userDoc.verificationNotes = notes;
  await userDoc.save();

  const clean = UserFarmService.mapUserDocToCleanUser(userDoc);
  console.log(`Updated account "${clean.email}" -> role=${clean.role}, accountStatus=${clean.accountStatus}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
