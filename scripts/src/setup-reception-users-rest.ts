// scripts/src/setup-reception-users-rest.ts
// Create/update Reception Firebase Auth users and their RTDB userProfiles via REST APIs.
//
// Why REST: avoids firebase-admin credentials; uses the project web API key.
//
// Usage:
//   pnpm exec tsx scripts/src/setup-reception-users-rest.ts \
//     --api-key "<FIREBASE_WEB_API_KEY>" \
//     --database-url "https://<db>.firebasedatabase.app" \
//     --writer-email "owner@example.com" \
//     --writer-password "..." \
//     --send-password-reset \
//     --user "email=cmarzano@gmail.com,displayName=Cristiana,roles=owner" \
//     --user "email=peter.cowling1976@gmail.com,displayName=Pete,roles=owner|developer"
//
// Notes:
// - If the user exists, you must provide a password (or use --send-password-reset and --set-temp-password)
//   to obtain their uid via sign-in. This script defaults to setting a random temp password for new users.
// - For existing users without a known password, prefer --send-password-reset and then rerun with --password.
// - If your RTDB rules lock down `userProfiles`, pass --writer-email/--writer-password for an owner/developer
//   who has permission to write other users' profiles.

import crypto from "node:crypto";

type UserRole = "owner" | "developer" | "staff";
type UserSpec = {
  email: string;
  displayName: string;
  roles: UserRole[];
  password?: string;
};

type Options = {
  apiKey: string;
  databaseUrl: string;
  users: UserSpec[];
  setTempPassword: boolean;
  sendPasswordReset: boolean;
  dryRun: boolean;
  writerEmail?: string;
  writerPassword?: string;
};

const VALID_ROLES = new Set<UserRole>(["owner", "developer", "staff"]);

function parseKeyValueList(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of input.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    result[key] = value;
  }
  return result;
}

function parseRoles(input: string | undefined): UserRole[] {
  const roles = (input ?? "")
    .split("|")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean) as UserRole[];
  const valid = roles.filter((r) => VALID_ROLES.has(r));
  if (!valid.length) return ["staff"];
  return Array.from(new Set(valid));
}

function parseArgs(argv: string[]): Options {
  let apiKey = process.env.FIREBASE_API_KEY ?? "";
  let databaseUrl = process.env.FIREBASE_DATABASE_URL ?? "";
  let writerEmail = process.env.FIREBASE_WRITER_EMAIL;
  let writerPassword = process.env.FIREBASE_WRITER_PASSWORD;
  const users: UserSpec[] = [];
  let setTempPassword = true;
  let sendPasswordReset = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--api-key" && argv[i + 1]) {
      apiKey = argv[i + 1];
      i++;
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.slice("--api-key=".length);
    } else if (arg === "--database-url" && argv[i + 1]) {
      databaseUrl = argv[i + 1];
      i++;
    } else if (arg.startsWith("--database-url=")) {
      databaseUrl = arg.slice("--database-url=".length);
    } else if (arg === "--writer-email" && argv[i + 1]) {
      writerEmail = argv[i + 1];
      i++;
    } else if (arg.startsWith("--writer-email=")) {
      writerEmail = arg.slice("--writer-email=".length);
    } else if (arg === "--writer-password" && argv[i + 1]) {
      writerPassword = argv[i + 1];
      i++;
    } else if (arg.startsWith("--writer-password=")) {
      writerPassword = arg.slice("--writer-password=".length);
    } else if (arg === "--user" && argv[i + 1]) {
      const fields = parseKeyValueList(argv[i + 1]);
      const email = fields.email;
      const displayName = fields.displayName ?? fields.displayname ?? "";
      const roles = parseRoles(fields.roles);
      const password = fields.password;
      if (!email || !displayName) {
        throw new Error(`Invalid --user spec (requires email,displayName): ${argv[i + 1]}`);
      }
      users.push({ email, displayName, roles, password });
      i++;
    } else if (arg.startsWith("--user=")) {
      const spec = arg.slice("--user=".length);
      const fields = parseKeyValueList(spec);
      const email = fields.email;
      const displayName = fields.displayName ?? fields.displayname ?? "";
      const roles = parseRoles(fields.roles);
      const password = fields.password;
      if (!email || !displayName) {
        throw new Error(`Invalid --user spec (requires email,displayName): ${spec}`);
      }
      users.push({ email, displayName, roles, password });
    } else if (arg === "--no-temp-password") {
      setTempPassword = false;
    } else if (arg === "--set-temp-password") {
      setTempPassword = true;
    } else if (arg === "--send-password-reset") {
      sendPasswordReset = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  if (!apiKey) throw new Error("Missing --api-key or FIREBASE_API_KEY.");
  if (!databaseUrl) throw new Error("Missing --database-url or FIREBASE_DATABASE_URL.");
  if (!users.length) throw new Error("Provide at least one --user spec.");

  return {
    apiKey,
    databaseUrl,
    users,
    setTempPassword,
    sendPasswordReset,
    dryRun,
    writerEmail: writerEmail || undefined,
    writerPassword: writerPassword || undefined,
  };
}

function randomPassword(): string {
  // 24 chars base64url (~144 bits) with a leading "A" to satisfy some password policies.
  return `A${crypto.randomBytes(18).toString("base64url")}`;
}

type IdentityErrorResponse = { error?: { message?: string } };

function getIdentityErrorMessage(response: unknown): string {
  const parsed = response as IdentityErrorResponse;
  return parsed?.error?.message ?? "UNKNOWN_ERROR";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T;
  if (!res.ok) {
    const message = getIdentityErrorMessage(json);
    throw new Error(message);
  }
  return json;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T;
  if (!res.ok) {
    throw new Error(`RTDB_WRITE_FAILED (${res.status})`);
  }
  return json;
}

type SignUpResponse = {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
};

type SignInResponse = SignUpResponse;

async function signUp(apiKey: string, email: string, password: string): Promise<SignUpResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`;
  return postJson<SignUpResponse>(url, { email, password, returnSecureToken: true });
}

async function signInWithPassword(
  apiKey: string,
  email: string,
  password: string
): Promise<SignInResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
  return postJson<SignInResponse>(url, { email, password, returnSecureToken: true });
}

async function sendPasswordReset(apiKey: string, email: string): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`;
  await postJson(url, { requestType: "PASSWORD_RESET", email });
}

async function writeUserProfile(
  databaseUrl: string,
  uid: string,
  idToken: string | null,
  profile: { displayName: string; roles: UserRole[]; createdAt: number; updatedAt: number }
): Promise<void> {
  const normalizedBase = databaseUrl.replace(/\/+$/, "");
  const authParam = idToken ? `?auth=${encodeURIComponent(idToken)}` : "";
  const url = `${normalizedBase}/userProfiles/${encodeURIComponent(uid)}.json${authParam}`;
  await putJson(url, profile);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const now = Date.now();
  let writerIdToken: string | null = null;

  if (options.writerEmail || options.writerPassword) {
    if (!options.writerEmail || !options.writerPassword) {
      throw new Error("Provide both --writer-email and --writer-password.");
    }
    const writer = await signInWithPassword(
      options.apiKey,
      options.writerEmail,
      options.writerPassword
    );
    writerIdToken = writer.idToken;
  }

  const summary: Array<{
    email: string;
    uid?: string;
    profileWritten: boolean;
    passwordResetSent: boolean;
    note?: string;
  }> = [];

  for (const user of options.users) {
    let uid: string | undefined;
    let idToken: string | null = null;
    let passwordResetSent = false;
    let profileWritten = false;

    const password = user.password ?? (options.setTempPassword ? randomPassword() : undefined);
    if (!password) {
      summary.push({
        email: user.email,
        profileWritten: false,
        passwordResetSent: false,
        note: "No password provided; cannot create/sign-in to obtain uid.",
      });
      continue;
    }

    try {
      const created = await signUp(options.apiKey, user.email, password);
      uid = created.localId;
      idToken = created.idToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      if (message === "EMAIL_EXISTS") {
        try {
          const signedIn = await signInWithPassword(options.apiKey, user.email, password);
          uid = signedIn.localId;
          idToken = signedIn.idToken;
        } catch (signInErr) {
          const signInMessage =
            signInErr instanceof Error ? signInErr.message : "UNKNOWN_ERROR";
          summary.push({
            email: user.email,
            profileWritten: false,
            passwordResetSent: false,
            note: `Account exists but sign-in failed (${signInMessage}). Provide the correct password or reset it.`,
          });
          if (options.sendPasswordReset) {
            try {
              await sendPasswordReset(options.apiKey, user.email);
              passwordResetSent = true;
            } catch {
              // ignore
            }
          }
          continue;
        }
      } else {
        summary.push({
          email: user.email,
          profileWritten: false,
          passwordResetSent: false,
          note: `Sign-up failed (${message}).`,
        });
        continue;
      }
    }

    if (!uid) {
      summary.push({
        email: user.email,
        profileWritten: false,
        passwordResetSent: false,
        note: "Could not determine uid.",
      });
      continue;
    }

    if (options.dryRun) {
      summary.push({
        email: user.email,
        uid,
        profileWritten: false,
        passwordResetSent: false,
        note: "Dry run (no writes).",
      });
      continue;
    }

    const profile = {
      displayName: user.displayName,
      roles: user.roles,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await writeUserProfile(
        options.databaseUrl,
        uid,
        writerIdToken ?? idToken,
        profile
      );
      profileWritten = true;
    } catch (writeErr) {
      const writeMsg = writeErr instanceof Error ? writeErr.message : "UNKNOWN_ERROR";
      summary.push({
        email: user.email,
        uid,
        profileWritten: false,
        passwordResetSent: false,
        note: `Failed writing userProfiles (${writeMsg}).`,
      });
      continue;
    }

    if (options.sendPasswordReset) {
      try {
        await sendPasswordReset(options.apiKey, user.email);
        passwordResetSent = true;
      } catch {
        // ignore
      }
    }

    summary.push({ email: user.email, uid, profileWritten, passwordResetSent });
  }

  // Do not print passwords; only ids and status.
  console.log(JSON.stringify({ ok: true, databaseUrl: options.databaseUrl, summary }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
