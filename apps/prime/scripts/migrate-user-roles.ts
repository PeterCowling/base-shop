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

import { readFile } from 'node:fs/promises';

import * as admin from 'firebase-admin';

const VALID_ROLES = ['owner', 'developer', 'admin', 'manager', 'staff', 'viewer'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

interface OldUserProfile {
  displayName: string;
  roles: string[] | Record<string, unknown>;
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
  oldRoles: string[] | Record<string, unknown>,
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
  console.info(`\n=== User Roles Migration ===`);
  console.info(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  // Initialize Firebase Admin
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountPath) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
    console.error('Set it to the path of your Firebase service account JSON file');
    process.exit(1);
  }

  let serviceAccount: { databaseURL?: string };
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-provided path from FIREBASE_SERVICE_ACCOUNT_KEY
    const serviceAccountRaw = await readFile(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountRaw) as { databaseURL?: string };
  } catch (error) {
    console.error(`Error: Unable to read service account JSON at "${serviceAccountPath}"`);
    console.error(error);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
  });

  const db = admin.database();
  const userProfilesRef = db.ref('userProfiles');

  console.info('Fetching all user profiles...');
  const snapshot = await userProfilesRef.once('value');
  const profiles = snapshot.val() as Record<string, OldUserProfile> | null;

  if (!profiles) {
    console.info('No user profiles found. Nothing to migrate.');
    return;
  }

  const userIds = Object.keys(profiles);
  console.info(`Found ${userIds.length} user profiles\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const uid of userIds) {
    const profile = profiles[uid];
    console.info(`Processing user: ${uid}`);

    if (!profile.roles) {
      console.info(`  Skipping: No roles defined`);
      skippedCount++;
      continue;
    }

    if (isAlreadyMigrated(profile.roles)) {
      console.info(`  Skipping: Already migrated`);
      skippedCount++;
      continue;
    }

    try {
      const newRoles = convertRoles(profile.roles);
      console.info(`  Old roles:`, profile.roles);
      console.info(`  New roles:`, newRoles);

      if (Object.keys(newRoles).length === 0) {
        console.info(`  Warning: No valid roles after conversion, skipping`);
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
        console.info(`  Migrated successfully`);
      } else {
        console.info(`  Would migrate (dry run)`);
      }
      migratedCount++;
    } catch (error) {
      console.error(`  Error migrating user ${uid}:`, error);
      errorCount++;
    }
  }

  console.info(`\n=== Migration Summary ===`);
  console.info(`Total profiles: ${userIds.length}`);
  console.info(`Migrated: ${migratedCount}`);
  console.info(`Skipped: ${skippedCount}`);
  console.info(`Errors: ${errorCount}`);

  if (dryRun && migratedCount > 0) {
    console.info(`\nTo apply changes, run without --dry-run flag`);
  }

  await admin.app().delete();
}

// Main execution
const dryRun = process.argv.includes('--dry-run');
migrateUserRoles(dryRun).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
