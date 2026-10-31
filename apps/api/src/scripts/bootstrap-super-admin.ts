/**
 * GreenAgro Secure First Super Admin Bootstrap Utility
 *
 * Purpose:
 *   Idempotently provisions or promotes the initial Platform Super Administrator
 *   on the server side without exposing public Super Admin registration.
 *
 * Usage:
 *   1. Promote an existing registered account (preserves user ID, password, and profile):
 *      npm run bootstrap-super-admin --workspace=apps/api -- <email>
 *
 *   2. Create a new Super Admin account if it does not yet exist:
 *      npm run bootstrap-super-admin --workspace=apps/api -- <email> --password "<StrongPassword>" --name "State Nodal Admin" --org "Rajasthan Agriculture Dept"
 *
 *   3. Or configure SUPER_ADMIN_EMAILS in .env and run:
 *      npm run bootstrap-super-admin --workspace=apps/api
 */

import mongoose from 'mongoose';
import { connectDatabase } from '../database';
import { config } from '../config';
import { UserFarmService } from '../services/db/userFarmService';

function parseCliArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

async function main() {
  const { positional, flags } = parseCliArgs(process.argv.slice(2));

  const targetEmail = (
    positional[0] ||
    flags.email ||
    process.env.SUPER_ADMIN_EMAIL ||
    config.superAdminEmails[0] ||
    ''
  )
    .toLowerCase()
    .trim();

  if (!targetEmail) {
    console.error('================================================================');
    console.error('❌ Missing target Super Admin email.');
    console.error('Usage:');
    console.error('  npm run bootstrap-super-admin --workspace=apps/api -- <email>');
    console.error('  or set SUPER_ADMIN_EMAILS=<email> in .env');
    console.error('================================================================');
    process.exit(1);
  }

  // Optional provisioning secret check if SUPER_ADMIN_BOOTSTRAP_SECRET is configured in .env
  const configuredSecret = (process.env.SUPER_ADMIN_BOOTSTRAP_SECRET || '').trim();
  if (configuredSecret) {
    const suppliedSecret = (flags.secret || process.env.BOOTSTRAP_SECRET || '').trim();
    if (suppliedSecret !== configuredSecret) {
      console.error('❌ Invalid or missing --secret for SUPER_ADMIN_BOOTSTRAP_SECRET verification.');
      process.exit(1);
    }
  }

  await connectDatabase();

  try {
    const result = await UserFarmService.bootstrapSuperAdmin({
      email: targetEmail,
      password: flags.password || process.env.SUPER_ADMIN_INITIAL_PASSWORD,
      name: flags.name,
      organizationName: flags.org || flags.organization,
      designation: flags.designation,
      state: flags.state,
      district: flags.district,
      organizationType: flags.type,
      provisionedBy: 'SYSTEM_BOOTSTRAP_CLI',
      notes: flags.notes || 'First Super Administrator provisioned via server-side bootstrap CLI',
    });

    console.log('================================================================');
    if (result.alreadySuperAdmin) {
      console.log('ℹ️  SUPER ADMIN ALREADY PROVISIONED (Idempotent Check Passed)');
    } else if (result.createdNew) {
      console.log('✅ NEW SUPER ADMIN ACCOUNT CREATED & VERIFIED');
    } else {
      console.log('✅ EXISTING ACCOUNT PROMOTED TO VERIFIED SUPER ADMIN');
    }
    console.log('----------------------------------------------------------------');
    console.log(`  User ID      : ${result.user.id}`);
    console.log(`  Name         : ${result.user.name}`);
    console.log(`  Email        : ${result.user.email}`);
    console.log(`  Role         : ${result.user.role}`);
    console.log(`  Status       : ${result.user.accountStatus}`);
    console.log(`  Super Admin  : ${result.user.isSuperAdmin}`);
    console.log(`  Organization : ${result.user.organizationName || 'N/A'}`);
    console.log(`  Permissions  : ${result.user.permissions.join(', ')}`);
    console.log('================================================================');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Super Admin Bootstrap Failed:', err.message || err);
  process.exit(1);
});

