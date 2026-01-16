// src/hooks/useBookingEmail.ts
/**
 * React hook for dispatching booking‑related “App‑Link” emails.
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

import { GuestEmailRecord } from "../schemas/guestEmailSchema";
import {
  EMAIL_TEST_ADDRESS,
  EMAIL_TEST_MODE,
  FIREBASE_BASE_URL,
  OCCUPANT_LINK_PREFIX,
} from "../utils/emailConstants";

/* -----------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------- */
type EmailMap = Record<string, string>;

const isTestEnvironment = process.env.NODE_ENV === "test";

/**
 * Fetch all guest emails for the given booking in a single request.
 */
export async function fetchGuestEmails(
  bookingRef: string
): Promise<Record<string, string>> {
  const url = `${FIREBASE_BASE_URL}/guestsDetails/${bookingRef}.json`;
  const resp = await fetch(url);
  const json = await resp.json();
  const parsed = z.record(GuestEmailRecord).safeParse(json);
  if (!parsed.success) {
    if (!isTestEnvironment) {
      console.error("Invalid guest email data", parsed.error);
    }
    return {};
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
   * Sends an App‑Link email that contains one link per guest.
   * Any `occupantEmails` supplied by the caller are merged with
   * emails fetched from Firebase (caller values win on conflict).
   */
  const sendBookingEmail = useCallback(
    async (bookingRef: string, occupantEmails: EmailMap = {}) => {
      setLoading(true);

      try {
        /* -------------------------------------------------- */
        /* 1️⃣  Fetch guest IDs for the booking               */
        /* -------------------------------------------------- */
        const bookingUrl = `${FIREBASE_BASE_URL}/bookings/${bookingRef}.json`;
        const bookingResp = await fetch(bookingUrl);
        const bookingRaw = await bookingResp.json();
        const bookingResult = z.record(z.any()).safeParse(bookingRaw);
        if (!bookingResult.success) {
          console.error("Invalid booking response", bookingResult.error);
          throw new Error("Invalid booking response");
        }
        const bookingJson = bookingResult.data;

        if (Object.keys(bookingJson).length === 0) {
          throw new Error(`No guests found under bookingRef "${bookingRef}"`);
        }

        const guestIds = Object.keys(bookingJson);

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
        const recipients = EMAIL_TEST_MODE
          ? [EMAIL_TEST_ADDRESS]
          : Object.values(mergedEmails).filter(Boolean);

        const links = guestIds.map((id) => `${OCCUPANT_LINK_PREFIX}${id}`);

        const params = new URLSearchParams();
        params.set("bookingRef", bookingRef);
        if (recipients.length) params.set("recipients", recipients.join(","));
        links.forEach((l) => params.append("occupant", l)); // repeated key

        /*  ⚠️  Single diagnostic log before the fetch        */
        console.log("➡️  GET", params.toString());

        /* -------------------------------------------------- */
        /* 4️⃣  Fire request                                  */
        /* -------------------------------------------------- */
        const resp = await fetch(
          `https://script.google.com/macros/s/AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW/exec?${params.toString()}`
        );
        const text = await resp.text();
        console.log("✅ response", text);
        setMessage(text);
      } catch (err) {
        console.error("❌ sendBookingEmail failed", err);
        setMessage((err as Error).message || "Failed to send email");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { sendBookingEmail, loading, message };
}
