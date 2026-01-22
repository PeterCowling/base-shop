/**
 * Migration script: Convert userProfiles roles from array to map structure
 *
 * BEFORE (vulnerable):
 *   roles: ['owner', 'staff']  // or roles: { '0': 'owner', '1': 'staff' }
 *
 * AFTER (secure):
 *   roles: { owner: true, staff: true }
 *
 * This migration fixes Critical Security Issue #3: Hardcoded role index checks
 * in Firebase rules that could be bypassed by inserting roles at unchecked indices.
 *
 * Usage:
 *   1. Set FIREBASE_SERVICE_ACCOUNT_KEY env var to path of service account JSON
 *   2. Run: npx tsx scripts/migrate-user-roles.ts [--dry-run]
 *
 * The script will:
 *   - Read all userProfiles
 *   - Convert array-style roles to map-style roles
 *   - Write back the converted profiles
 *   - Report any issues
 */

import * as admin from 'firebase-admin';

const VALID_ROLES = ['owner', 'developer', 'staff'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

interface OldUserProfile {
  displayName: string;
  roles: string[] | Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
}

interface NewUserProfile {
  displayName: string;
  roles: Partial<Record<ValidRole, true>>;
  createdAt?: number;
  updatedAt?: number;
}

function convertRoles(
  oldRoles: string[] | Record<string, string>,
): Partial<Record<ValidRole, true>> {
  const newRoles: Partial<Record<ValidRole, true>> = {};

  // Handle array format: ['owner', 'staff']
  if (Array.isArray(oldRoles)) {
    for (const role of oldRoles) {
      if (VALID_ROLES.includes(role as ValidRole)) {
        newRoles[role as ValidRole] = true;
      } else {
        console.warn(`  Warning: Skipping invalid role "${role}"`);
      }
    }
    return newRoles;
  }

  // Handle object format: { '0': 'owner', '1': 'staff' }
  if (typeof oldRoles === 'object' && oldRoles !== null) {
    for (const [key, role] of Object.entries(oldRoles)) {
      // Skip if already in new format (key is role name, value is boolean)
      if (VALID_ROLES.includes(key as ValidRole) && role === true) {
        newRoles[key as ValidRole] = true;
        continue;
      }

      // Convert old format (key is index, value is role name)
      if (typeof role === 'string' && VALID_ROLES.includes(role as ValidRole)) {
        newRoles[role as ValidRole] = true;
      } else if (typeof role === 'string') {
        console.warn(`  Warning: Skipping invalid role "${role}" at index ${key}`);
      }
    }
    return newRoles;
  }

  console.warn(`  Warning: Unknown roles format:`, oldRoles);
  return newRoles;
}

function isAlreadyMigrated(roles: unknown): boolean {
  if (typeof roles !== 'object' || roles === null || Array.isArray(roles)) {
    return false;
  }

  // Check if all keys are valid role names and all values are true
  return Object.entries(roles).every(
    ([key, value]) => VALID_ROLES.includes(key as ValidRole) && value === true,
  );
}

async function migrateUserRoles(dryRun: boolean): Promise<void> {
  console.log(`\n=== User Roles Migration ===`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  // Initialize Firebase Admin
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountPath) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
    console.error('Set it to the path of your Firebase service account JSON file');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
  });

  const db = admin.database();
  const userProfilesRef = db.ref('userProfiles');

  console.log('Fetching all user profiles...');
  const snapshot = await userProfilesRef.once('value');
  const profiles = snapshot.val() as Record<string, OldUserProfile> | null;

  if (!profiles) {
    console.log('No user profiles found. Nothing to migrate.');
    return;
  }

  const userIds = Object.keys(profiles);
  console.log(`Found ${userIds.length} user profiles\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const uid of userIds) {
    const profile = profiles[uid];
    console.log(`Processing user: ${uid}`);

    if (!profile.roles) {
      console.log(`  Skipping: No roles defined`);
      skippedCount++;
      continue;
    }

    if (isAlreadyMigrated(profile.roles)) {
      console.log(`  Skipping: Already migrated`);
      skippedCount++;
      continue;
    }

    try {
      const newRoles = convertRoles(profile.roles);
      console.log(`  Old roles:`, profile.roles);
      console.log(`  New roles:`, newRoles);

      if (Object.keys(newRoles).length === 0) {
        console.log(`  Warning: No valid roles after conversion, skipping`);
        skippedCount++;
        continue;
      }

      if (!dryRun) {
        const newProfile: NewUserProfile = {
          ...profile,
          roles: newRoles,
          updatedAt: Date.now(),
        };
        await userProfilesRef.child(uid).set(newProfile);
        console.log(`  Migrated successfully`);
      } else {
        console.log(`  Would migrate (dry run)`);
      }
      migratedCount++;
    } catch (error) {
      console.error(`  Error migrating user ${uid}:`, error);
      errorCount++;
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total profiles: ${userIds.length}`);
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);

  if (dryRun && migratedCount > 0) {
    console.log(`\nTo apply changes, run without --dry-run flag`);
  }

  await admin.app().delete();
}

// Main execution
const dryRun = process.argv.includes('--dry-run');
migrateUserRoles(dryRun).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
