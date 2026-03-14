// src/hooks/useBookingEmail.ts
/**
 * React hook for creating booking-related “App-Link” email drafts.
 *
 * ✦ NEW:  All guest ( = occupant ) IDs in the booking are now
 *         automatically discovered from Firebase and **every** guest
 *         receives their own personalised link, even if the caller
 *         supplied only one.
 *
 * Usage:
 *   const { sendBookingEmail, loading, message } = useBookingEmail();
 *   sendBookingEmail("7763-569729918");                 // auto‑discovers guests
 *   // ─ or ─
 *   sendBookingEmail("7763-569729918", {                // manual overrides
 *     occ_1747917762222: "valeriarojas1d.2310@gmail.com",
 *   });
 */

import { useCallback, useState } from "react";
import { z } from "zod";

import {
  bookingRootPath,
  guestDetailsBookingPath,
} from "@acme/lib/hospitality";

import { firebaseBookingSchema } from "../schemas/bookingsSchema";
import { GuestEmailRecord } from "../schemas/guestEmailSchema";
import {
  EMAIL_TEST_ADDRESS,
  EMAIL_TEST_MODE,
  FIREBASE_BASE_URL,
  OCCUPANT_LINK_PREFIX,
} from "../utils/emailConstants";

import { buildMcpAuthHeaders } from "./mcpAuthHeaders";

/* -----------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------- */
type EmailMap = Record<string, string>;

interface BookingEmailRouteResponse {
  success?: boolean;
  draftId?: string;
  messageId?: string;
  error?: string;
}

export interface SendBookingEmailResult {
  success: boolean;
  bookingRef: string;
  occupantIds: string[];
  recipients: string[];
  occupantLinks: string[];
  draftId?: string;
  messageId?: string;
  error?: string;
}

const isTestEnvironment = process.env.NODE_ENV === "test";
const TEST_MODE_ENV_KEY = "NEXT_PUBLIC_BOOKING_EMAIL_TEST_MODE";
const FIREBASE_URL_ENV_KEY = "NEXT_PUBLIC_FIREBASE_DATABASE_URL";
const OCCUPANT_LINK_PREFIX_ENV_KEY = "NEXT_PUBLIC_BOOKING_OCCUPANT_LINK_PREFIX";
const TEST_ADDRESS_ENV_KEY = "NEXT_PUBLIC_BOOKING_EMAIL_TEST_ADDRESS";

function isBookingEmailTestModeEnabled(): boolean {
  return EMAIL_TEST_MODE || process.env[TEST_MODE_ENV_KEY] === "true";
}

function requireFirebaseBaseUrl(): string {
  if (!FIREBASE_BASE_URL) {
    throw new Error(`Missing ${FIREBASE_URL_ENV_KEY} configuration`);
  }
  return FIREBASE_BASE_URL;
}

function requireOccupantLinkPrefix(): string {
  if (!OCCUPANT_LINK_PREFIX) {
    throw new Error(`Missing ${OCCUPANT_LINK_PREFIX_ENV_KEY} configuration`);
  }
  return OCCUPANT_LINK_PREFIX;
}

function requireBookingEmailConfig(testMode: boolean): {
  firebaseBaseUrl: string;
  occupantLinkPrefix: string;
} {
  const firebaseBaseUrl = requireFirebaseBaseUrl();
  const occupantLinkPrefix = requireOccupantLinkPrefix();

  if (testMode && !EMAIL_TEST_ADDRESS) {
    throw new Error(`Missing ${TEST_ADDRESS_ENV_KEY} configuration`);
  }

  return { firebaseBaseUrl, occupantLinkPrefix };
}

/**
 * Fetch all guest emails for the given booking in a single request.
 */
export async function fetchGuestEmails(
  bookingRef: string
): Promise<Record<string, string>> {
  const firebaseBaseUrl = requireFirebaseBaseUrl();
  const url = `${firebaseBaseUrl}/${guestDetailsBookingPath(bookingRef)}.json`;
  const resp = await fetch(url);
  if (resp.ok === false) {
    throw new Error(
      `Failed to fetch guest emails (${resp.status || "unknown-status"})`
    );
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch {
    throw new Error("Invalid guest email response payload");
  }

  const parsed = z.record(GuestEmailRecord).safeParse(json);
  if (!parsed.success) {
    if (!isTestEnvironment) {
      console.error("Invalid guest email data", parsed.error);
    }
    throw new Error("Invalid guest email data");
  }
  const data = parsed.data;
  return Object.fromEntries(
    Object.entries(data).map(([id, d]) => [id, d.email ?? ""])
  );
}

/* -----------------------------------------------------------------------
 * Hook
 * --------------------------------------------------------------------- */
export default function useBookingEmail() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /**
   * Creates an App-Link email draft that contains one link per guest.
   * Any `occupantEmails` supplied by the caller are merged with
   * emails fetched from Firebase (caller values win on conflict).
   */
  const sendBookingEmail = useCallback(
    async (
      bookingRef: string,
      occupantEmails: EmailMap = {}
    ): Promise<SendBookingEmailResult> => {
      setLoading(true);

      const emptyResult: SendBookingEmailResult = {
        success: false,
        bookingRef,
        occupantIds: [],
        recipients: [],
        occupantLinks: [],
      };

      try {
        /* -------------------------------------------------- */
        /* 1️⃣  Fetch guest IDs for the booking               */
        /* -------------------------------------------------- */
        const emailTestMode = isBookingEmailTestModeEnabled();
        const { firebaseBaseUrl, occupantLinkPrefix } = requireBookingEmailConfig(
          emailTestMode,
        );
        const bookingUrl = `${firebaseBaseUrl}/${bookingRootPath(bookingRef)}.json`;
        const bookingResp = await fetch(bookingUrl);
        if (bookingResp.ok === false) {
          throw new Error(
            `Failed to fetch booking (${bookingResp.status || "unknown-status"})`
          );
        }
        const bookingRaw = await bookingResp.json();
        const bookingResult = firebaseBookingSchema.safeParse(bookingRaw);
        if (!bookingResult.success) {
          console.error("Invalid booking response", bookingResult.error);
          throw new Error("Invalid booking response");
        }
        const bookingJson = bookingResult.data;

        const guestIds = Object.keys(bookingJson).filter((id) => id !== "__notes");

        if (guestIds.length === 0) {
          throw new Error(`No guests found under bookingRef "${bookingRef}"`);
        }

        /* -------------------------------------------------- */
        /* 2️⃣  Consolidate emails                            */
        /*     ‑ Merge caller‑supplied & server‑fetched data  */
        /* -------------------------------------------------- */
        const fetchedEmails = await fetchGuestEmails(bookingRef);
        const mergedEmails: EmailMap = {
          ...fetchedEmails,
          ...occupantEmails,
        };

        /* -------------------------------------------------- */
        /* 3️⃣  Build recipients + links                      */
        /* -------------------------------------------------- */
        const recipients = emailTestMode
          ? [EMAIL_TEST_ADDRESS]
          : Array.from(new Set(Object.values(mergedEmails).filter(Boolean)));

        if (recipients.length === 0) {
          throw new Error(
            "No recipient email addresses found for this booking"
          );
        }

        const links = guestIds.map((id) => `${occupantLinkPrefix}${id}`);
        const headers = await buildMcpAuthHeaders();

        const resp = await fetch("/api/mcp/booking-email", {
          method: "POST",
          headers,
          body: JSON.stringify({
            bookingRef,
            recipients,
            occupantLinks: links,
          }),
        });
        const json = (await resp.json()) as BookingEmailRouteResponse;
        if (!resp.ok || !json?.success) {
          throw new Error(json?.error || "Failed to create booking email draft");
        }

        const successResult: SendBookingEmailResult = {
          success: true,
          bookingRef,
          occupantIds: guestIds,
          recipients,
          occupantLinks: links,
          draftId: json?.draftId,
          messageId: json?.messageId,
        };

        setMessage(json?.messageId ?? "sent");
        return successResult;
      } catch (err) {
        const error = err as Error;
        console.error("❌ sendBookingEmail failed", error);
        setMessage(error.message || "Failed to create email draft");
        return {
          ...emptyResult,
          error: error.message || "Failed to create email draft",
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { sendBookingEmail, loading, message };
}
