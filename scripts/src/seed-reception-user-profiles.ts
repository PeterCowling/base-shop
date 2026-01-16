// scripts/src/seed-reception-user-profiles.ts
// Seed Reception userProfiles from Firebase Auth users.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

type UserRole = "owner" | "developer" | "staff";

type ProfileOverride = {
  displayName?: string;
  roles?: UserRole[];
};

type OverridesMap = Record<string, ProfileOverride>;

type ExistingProfile = {
  displayName?: string;
  roles?: UserRole[];
  createdAt?: number;
  updatedAt?: number;
};

type Options = {
  serviceAccountPath: string;
  databaseURL: string;
  defaultRole: UserRole;
  overridesPath?: string;
  overwrite: boolean;
  dryRun: boolean;
  limit?: number;
};

const VALID_ROLES = new Set<UserRole>(["owner", "developer", "staff"]);
const DEFAULT_BATCH_SIZE = 250;

function parseArgs(argv: string[]): Options {
  let serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
  let databaseURL = process.env.FIREBASE_DATABASE_URL ?? "";
  let overridesPath: string | undefined;
  let defaultRole: UserRole = "staff";
  let overwrite = false;
  let dryRun = false;
  let limit: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--service-account" && argv[i + 1]) {
      serviceAccountPath = argv[i + 1];
      i++;
    } else if (arg.startsWith("--service-account=")) {
      serviceAccountPath = arg.slice("--service-account=".length);
    } else if (arg === "--database-url" && argv[i + 1]) {
      databaseURL = argv[i + 1];
      i++;
    } else if (arg.startsWith("--database-url=")) {
      databaseURL = arg.slice("--database-url=".length);
    } else if (arg === "--overrides" && argv[i + 1]) {
      overridesPath = argv[i + 1];
      i++;
    } else if (arg.startsWith("--overrides=")) {
      overridesPath = arg.slice("--overrides=".length);
    } else if (arg === "--default-role" && argv[i + 1]) {
      defaultRole = normalizeRole(argv[i + 1]) ?? defaultRole;
      i++;
    } else if (arg.startsWith("--default-role=")) {
      defaultRole =
        normalizeRole(arg.slice("--default-role=".length)) ?? defaultRole;
    } else if (arg === "--overwrite") {
      overwrite = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--limit" && argv[i + 1]) {
      const parsed = Number(argv[i + 1]);
      limit = Number.isFinite(parsed) ? parsed : undefined;
      i++;
    } else if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.slice("--limit=".length));
      limit = Number.isFinite(parsed) ? parsed : undefined;
    }
  }

  if (!serviceAccountPath) {
    throw new Error("Missing --service-account or GOOGLE_APPLICATION_CREDENTIALS.");
  }
  if (!databaseURL) {
    throw new Error("Missing --database-url or FIREBASE_DATABASE_URL.");
  }

  return {
    serviceAccountPath,
    databaseURL,
    defaultRole,
    overridesPath,
    overwrite,
    dryRun,
    limit,
  };
}

function normalizeRole(value: string | undefined): UserRole | null {
  if (!value) return null;
  const candidate = value.trim().toLowerCase() as UserRole;
  return VALID_ROLES.has(candidate) ? candidate : null;
}

function normalizeRoles(
  roles: UserRole[] | undefined,
  fallback: UserRole
): UserRole[] {
  const valid = (roles ?? []).filter((role) => VALID_ROLES.has(role));
  return valid.length ? valid : [fallback];
}

function loadOverrides(overridesPath?: string): OverridesMap | null {
  if (!overridesPath) return null;
  const resolvedPath = resolve(overridesPath);
  const raw = readFileSync(resolvedPath, "utf-8");
  const parsed = JSON.parse(raw) as OverridesMap;
  return parsed;
}

function inferDisplayName(email?: string | null, uid?: string): string {
  if (email) {
    const localPart = email.split("@")[0] ?? email;
    const cleaned = localPart.replace(/[._-]+/g, " ").trim();
    if (cleaned) {
      return cleaned
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
  return uid ?? "User";
}

function resolveOverride(
  overrides: OverridesMap | null,
  uid: string,
  email?: string | null
): ProfileOverride | null {
  if (!overrides) return null;
  const byUid = overrides[`uid:${uid}`] ?? overrides[uid];
  if (byUid) return byUid;
  if (!email) return null;
  const normalizedEmail = email.toLowerCase();
  return overrides[`email:${normalizedEmail}`] ?? overrides[normalizedEmail] ?? null;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const overrides = loadOverrides(options.overridesPath);

  const serviceAccount = JSON.parse(
    readFileSync(resolve(options.serviceAccountPath), "utf-8")
  );

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: options.databaseURL,
    });
  }

  const auth = getAuth();
  const database = getDatabase();

  const existingSnap = await database.ref("userProfiles").get();
  const existingProfiles =
    (existingSnap.exists() ? existingSnap.val() : {}) as Record<
      string,
      ExistingProfile
    >;

  const updates: Record<string, ExistingProfile> = {};
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let processedCount = 0;

  let pageToken: string | undefined;
  while (true) {
    const batch = await auth.listUsers(1000, pageToken);
    for (const user of batch.users) {
      if (options.limit && processedCount >= options.limit) {
        break;
      }
      processedCount += 1;

      const override = resolveOverride(overrides, user.uid, user.email);
      const displayName =
        override?.displayName ??
        user.displayName ??
        inferDisplayName(user.email, user.uid);
      const roles = normalizeRoles(override?.roles, options.defaultRole);

      const existing = existingProfiles[user.uid];
      if (existing && !options.overwrite) {
        skippedCount += 1;
        continue;
      }

      const now = Date.now();
      updates[`userProfiles/${user.uid}`] = {
        displayName,
        roles,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (existing) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    }

    if (options.limit && processedCount >= options.limit) {
      break;
    }

    pageToken = batch.pageToken;
    if (!pageToken) break;
  }

  if (options.dryRun) {
    console.log("Dry run complete.");
    console.log({
      processed: processedCount,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    });
    return;
  }

  const updateEntries = Object.entries(updates);
  for (let i = 0; i < updateEntries.length; i += DEFAULT_BATCH_SIZE) {
    const slice = updateEntries.slice(i, i + DEFAULT_BATCH_SIZE);
    const payload = Object.fromEntries(slice);
    // eslint-disable-next-line no-await-in-loop
    await database.ref().update(payload);
  }

  console.log("User profile seeding complete.");
  console.log({
    processed: processedCount,
    created: createdCount,
    updated: updatedCount,
    skipped: skippedCount,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}