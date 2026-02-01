/**
 * Gmail API Client with OAuth2 Authentication
 *
 * Provides Gmail API access for email operations in the MCP server.
 * Uses User OAuth flow with @google-cloud/local-auth for initial authorization.
 *
 * First-time setup requires:
 * 1. Create OAuth credentials in Google Cloud Console (Desktop app type)
 * 2. Download credentials.json to packages/mcp-server/
 * 3. Run the MCP server - browser will open for authorization
 * 4. Token is saved to token.json for future use
 *
 * @see https://developers.google.com/gmail/api/quickstart/nodejs
 */

import { authenticate } from "@google-cloud/local-auth";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import type { gmail_v1 } from "googleapis";
import { google } from "googleapis";
import { join } from "path";

// OAuth2 scopes needed for Gmail operations
// - readonly: List and read emails
// - modify: Modify labels on emails
// - compose: Create drafts
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
];

// File paths for OAuth credentials (relative to cwd)
const CREDENTIALS_PATH = join(process.cwd(), "credentials.json");
const TOKEN_PATH = join(process.cwd(), "token.json");

/**
 * Token payload structure from OAuth2
 */
interface TokenPayload {
  type: "authorized_user";
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

/**
 * Credentials structure with refresh token
 */
interface OAuthCredentials {
  refresh_token?: string | null;
}

/**
 * Minimal auth client interface for what we need
 */
interface AuthClient {
  credentials: OAuthCredentials;
}

/**
 * Result type for Gmail client initialization
 */
export type GmailClientResult =
  | { success: true; client: gmail_v1.Gmail }
  | { success: false; error: string; needsSetup?: boolean };

/**
 * Load saved OAuth token from token.json
 * Returns an auth client if token exists and is valid
 */
async function loadSavedToken(): Promise<AuthClient | null> {
  try {
    if (!existsSync(TOKEN_PATH)) {
      return null;
    }
    const content = await readFile(TOKEN_PATH, "utf-8");
    const credentials = JSON.parse(content) as TokenPayload;
    return google.auth.fromJSON(credentials) as AuthClient;
  } catch {
    // Token file doesn't exist or is invalid
    return null;
  }
}

/**
 * Save OAuth token to token.json for future use
 * Extracts client_id, client_secret, and refresh_token from the credentials
 */
async function saveToken(client: AuthClient): Promise<void> {
  try {
    const content = await readFile(CREDENTIALS_PATH, "utf-8");
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const payload: TokenPayload = {
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token || "",
    };

    await writeFile(TOKEN_PATH, JSON.stringify(payload, null, 2));
  } catch (error) {
    // Non-fatal: token will need to be re-authorized next time
    console.error("[Gmail] Failed to save token:", error);
  }
}

/**
 * Check if OAuth credentials file exists
 */
export function hasCredentialsFile(): boolean {
  return existsSync(CREDENTIALS_PATH);
}

/**
 * Check if OAuth token file exists
 */
export function hasTokenFile(): boolean {
  return existsSync(TOKEN_PATH);
}

/**
 * Get Gmail client status for diagnostics
 */
export function getGmailClientStatus(): {
  hasCredentials: boolean;
  hasToken: boolean;
  credentialsPath: string;
  tokenPath: string;
} {
  return {
    hasCredentials: hasCredentialsFile(),
    hasToken: hasTokenFile(),
    credentialsPath: CREDENTIALS_PATH,
    tokenPath: TOKEN_PATH,
  };
}

/**
 * Authorize and get auth client
 * First tries to load saved token, then falls back to interactive auth
 *
 * @param interactive - If true, will run interactive OAuth flow if no token exists
 * @returns Auth client if authorized, null if not authorized and interactive=false
 */
async function authorize(interactive = false): Promise<AuthClient | null> {
  // Try to load saved token first
  const savedClient = await loadSavedToken();
  if (savedClient) {
    return savedClient;
  }

  // If not interactive, we can't prompt for auth
  if (!interactive) {
    return null;
  }

  // Check if credentials file exists
  if (!hasCredentialsFile()) {
    throw new Error(
      `Gmail credentials not found at ${CREDENTIALS_PATH}. ` +
        "Please download OAuth credentials from Google Cloud Console and save as credentials.json"
    );
  }

  // Run interactive OAuth flow
  // This will open a browser for the user to authorize
  const client = await authenticate({
    scopes: GMAIL_SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  // Save the token for future use
  if (client.credentials) {
    await saveToken(client as unknown as AuthClient);
  }

  return client as unknown as AuthClient;
}

/**
 * Get authenticated Gmail API client
 *
 * @param options.interactive - If true, will run interactive OAuth flow if no token exists (default: false)
 * @returns GmailClientResult with either the client or an error
 *
 * @example
 * ```ts
 * const result = await getGmailClient();
 * if (!result.success) {
 *   return errorResult(result.error);
 * }
 * const gmail = result.client;
 * const messages = await gmail.users.messages.list({ userId: 'me' });
 * ```
 */
export async function getGmailClient(
  options: { interactive?: boolean } = {}
): Promise<GmailClientResult> {
  const { interactive = false } = options;

  try {
    // Check for credentials file first
    if (!hasCredentialsFile()) {
      return {
        success: false,
        error:
          `Gmail credentials not found. Please download OAuth credentials from ` +
          `Google Cloud Console and save to: ${CREDENTIALS_PATH}`,
        needsSetup: true,
      };
    }

    // Try to authorize
    const auth = await authorize(interactive);

    if (!auth) {
      return {
        success: false,
        error:
          `Gmail not authorized. Token not found at ${TOKEN_PATH}. ` +
          `Run with interactive=true to authorize, or use the setup script.`,
        needsSetup: true,
      };
    }

    // Create Gmail client
    // The auth object is compatible with googleapis even though types differ
    const gmail = google.gmail({
      version: "v1",
      auth: auth as Parameters<typeof google.gmail>[0]["auth"],
    });

    return { success: true, client: gmail };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Gmail client initialization failed: ${message}`,
    };
  }
}

/**
 * Test Gmail API connection
 * Calls users.getProfile to verify authentication works
 *
 * @returns Result with user's email address if successful
 */
export async function testGmailConnection(): Promise<
  | { success: true; email: string }
  | { success: false; error: string; needsSetup?: boolean }
> {
  const result = await getGmailClient();
  if (!result.success) {
    return result;
  }

  try {
    const profile = await result.client.users.getProfile({ userId: "me" });
    return {
      success: true,
      email: profile.data.emailAddress || "unknown",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Gmail API call failed: ${message}`,
    };
  }
}

/**
 * Run interactive OAuth setup
 * Opens browser for user authorization and saves token
 *
 * @returns Result with user's email address if successful
 */
export async function runInteractiveSetup(): Promise<
  | { success: true; email: string; tokenPath: string }
  | { success: false; error: string }
> {
  try {
    // Check for credentials file
    if (!hasCredentialsFile()) {
      return {
        success: false,
        error:
          `Credentials file not found at ${CREDENTIALS_PATH}. ` +
          "Please download OAuth credentials from Google Cloud Console first.",
      };
    }

    console.info("[Gmail] Starting interactive OAuth setup...");
    console.info("[Gmail] A browser window will open for authorization.");

    // Run interactive auth
    const result = await getGmailClient({ interactive: true });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Verify it works
    const testResult = await testGmailConnection();
    if (!testResult.success) {
      return { success: false, error: testResult.error };
    }

    console.info(`[Gmail] Successfully authorized as: ${testResult.email}`);
    console.info(`[Gmail] Token saved to: ${TOKEN_PATH}`);

    return {
      success: true,
      email: testResult.email,
      tokenPath: TOKEN_PATH,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Interactive setup failed: ${message}`,
    };
  }
}
