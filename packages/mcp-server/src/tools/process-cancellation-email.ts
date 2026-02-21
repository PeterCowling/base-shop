/**
 * MCP Tool: process_cancellation_email
 *
 * TASK-14: Automated processing of inbound Octorate cancellation emails
 *
 * Workflow:
 * 1. Parse email via cancellation-email-parser
 * 2. Validate booking exists at /bookings/{reservationCode} (Firebase REST read)
 * 3. Enumerate occupants from /bookings/{reservationCode}
 * 4. Write activity code 22 for EACH occupant to fanout paths (collision-safe activityIds)
 * 5. Write booking metadata to /bookingMeta/{reservationCode}/ (status="cancelled")
 */

import { parseCancellationEmail } from "../parsers/cancellation-email-parser.js";

// ---------------------------------------------------------------------------
// Firebase REST helpers (reused from outbound-drafts.ts pattern)
// ---------------------------------------------------------------------------

function buildFirebaseUrl(
  baseUrl: string,
  path: string,
  apiKey?: string
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}.json`);
  if (apiKey) {
    url.searchParams.set("auth", apiKey);
  }
  return url.toString();
}

async function firebaseGet<T>(
  baseUrl: string,
  path: string,
  apiKey?: string
): Promise<T | null> {
  const url = buildFirebaseUrl(baseUrl, path, apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Firebase GET ${path}: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as T | null;
}

async function firebasePatch(
  baseUrl: string,
  path: string,
  data: Record<string, unknown>,
  apiKey?: string
): Promise<void> {
  const url = buildFirebaseUrl(baseUrl, path, apiKey);
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Firebase PATCH ${path}: ${response.status} ${response.statusText}`
    );
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessCancellationResult {
  status: "success" | "parse-failed" | "booking-not-found" | "write-failed";
  reason?: string;
  reservationCode?: string;
  activitiesWritten?: number;
}

// ---------------------------------------------------------------------------
// Core processing
// ---------------------------------------------------------------------------

/**
 * Process a cancellation email and update Firebase booking status + activities.
 *
 * @param emailId - Gmail message ID (for logging)
 * @param emailHtml - The email body (HTML or plain text)
 * @param from - The sender email address
 * @param firebaseUrl - Firebase Realtime Database base URL
 * @param firebaseApiKey - Firebase API key (optional for REST API auth)
 * @returns Result with status and metadata
 */
export async function processCancellationEmail(
  emailId: string,
  emailHtml: string,
  from: string,
  firebaseUrl: string,
  firebaseApiKey?: string
): Promise<ProcessCancellationResult> {
  // Step 1: Parse email to extract reservation code
  const parsed = parseCancellationEmail(emailHtml, from);

  if (!parsed) {
    return {
      status: "parse-failed",
      reason: "Could not extract reservation code from email",
    };
  }

  const { reservationCode } = parsed;

  // Step 2: Validate booking exists
  const booking = await firebaseGet<Record<string, boolean>>(
    firebaseUrl,
    `/bookings/${reservationCode}`,
    firebaseApiKey
  );

  if (!booking || Object.keys(booking).length === 0) {
    return {
      status: "booking-not-found",
      reason: `Booking ${reservationCode} not found in Firebase`,
    };
  }

  // Step 3: Enumerate occupants (keys of booking object)
  const occupantIds = Object.keys(booking);

  // Step 4: Write activity code 22 for each occupant (collision-safe activityIds)
  const timestamp = new Date().toISOString();
  const baseActivityId = Date.now();

  try {
    // Write activities with retry logic
    await Promise.all(
      occupantIds.map(async (occupantId, index) => {
        const activityId = `act_${baseActivityId}_${index}`;
        const activityData = {
          code: 22,
          timestamp,
          who: "Octorate",
        };

        // Retry once on failure
        try {
          await firebasePatch(
            firebaseUrl,
            `/activities/${occupantId}/${activityId}`,
            activityData,
            firebaseApiKey
          );
        } catch {
          // Retry once
          await firebasePatch(
            firebaseUrl,
            `/activities/${occupantId}/${activityId}`,
            activityData,
            firebaseApiKey
          );
        }
      })
    );
  } catch (error) {
    return {
      status: "write-failed",
      reason: `Firebase write failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Step 5: Write booking metadata (status="cancelled")
  try {
    await firebasePatch(
      firebaseUrl,
      `/bookingMeta/${reservationCode}`,
      {
        status: "cancelled",
        cancelledAt: timestamp,
        cancelledBy: "Octorate",
      },
      firebaseApiKey
    );
  } catch {
    // Retry once
    try {
      await firebasePatch(
        firebaseUrl,
        `/bookingMeta/${reservationCode}`,
        {
          status: "cancelled",
          cancelledAt: timestamp,
          cancelledBy: "Octorate",
        },
        firebaseApiKey
      );
    } catch (retryError) {
      return {
        status: "write-failed",
        reason: `Firebase bookingMeta write failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
      };
    }
  }

  return {
    status: "success",
    reservationCode,
    activitiesWritten: occupantIds.length,
  };
}
