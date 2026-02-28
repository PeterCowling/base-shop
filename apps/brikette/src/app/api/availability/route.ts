// apps/brikette/src/app/api/availability/route.ts
// Server-side proxy for the public Octobook booking engine HTML endpoint.
// Parses room availability and pricing from rendered HTML.
// No authentication required — Octobook returns full results on an unauthenticated GET.

import { NextResponse } from "next/server";

import { OCTORATE_LIVE_AVAILABILITY } from "@/config/env";
import { BOOKING_CODE } from "@/context/modal/constants";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Exported types (consumed by useAvailability hook and RoomCard)
// ---------------------------------------------------------------------------

export interface OctorateRoom {
  octorateRoomName: string;
  octorateRoomId: string;
  available: boolean;
  priceFrom: number | null;
  nights: number;
  ratePlans: Array<{ label: string }>;
}

export interface AvailabilityRouteResponse {
  rooms: OctorateRoom[];
  fetchedAt: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Count calendar days between two YYYY-MM-DD date strings. */
function countNights(checkin: string, checkout: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / msPerDay
  );
}

/** Validate that a string is a well-formed YYYY-MM-DD date. */
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

/**
 * Parse the Octobook price string into a numeric total (EUR).
 * Input examples:
 *   "Price from €189 ,98 Tourist Tax 5.00 EUR 2 Nights 1 Adult"
 *   "Price from &euro;95,00 Tourist Tax 3.00 EUR 1 Night 1 Adult"
 * Returns null if no valid price found.
 */
function parseTotalPrice(offertText: string): number | null {
  // Normalise HTML entity for euro sign
  const text = offertText.replace(/&euro;/gi, "€");

  // Match € followed by digits, optional space, comma or dot, digits
  const match = text.match(/€\s*([\d]+)\s*[,.](\d+)/);
  if (!match) return null;

  const intPart = match[1];
  const fracPart = match[2];
  const total = parseFloat(`${intPart}.${fracPart}`);
  return isNaN(total) ? null : total;
}

/**
 * Extract all text content from a raw HTML fragment (strips tags).
 * Used to check "Not available" in offert div text.
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Parse a single room section HTML fragment into an OctorateRoom.
 */
function parseRoomSection(sectionHtml: string, nights: number): OctorateRoom {
  // Extract room id + name from <h1 class="animated fadeInDownShort" data-id="N">Name</h1>
  const h1Match = sectionHtml.match(
    /<h1[^>]*class="animated fadeInDownShort"[^>]*data-id="([^"]*)"[^>]*>([\s\S]*?)<\/h1>/
  );
  const octorateRoomId = h1Match ? h1Match[1].trim() : "";
  const octorateRoomName = h1Match ? stripTags(h1Match[2]).trim() : "Unknown";

  // Extract offert div content
  const offertMatch = sectionHtml.match(/<div[^>]*class="offert"[^>]*>([\s\S]*?)<\/div>/);
  const offertHtml = offertMatch ? offertMatch[1] : "";
  const offertText = stripTags(offertHtml);

  // Check for sold-out — these are Octobook HTML sentinel strings, not UI copy
  const isSoldOut =
    offertText.includes("Not available") || // i18n-exempt -- BRIK-1 [ttl=2027-02-27] Octobook HTML sentinel string, server-side only
    offertText.includes("No availability"); // i18n-exempt -- BRIK-1 [ttl=2027-02-27] Octobook HTML sentinel string, server-side only

  // Parse price (only when available)
  let priceFrom: number | null = null;
  if (!isSoldOut) {
    const totalPrice = parseTotalPrice(offertText);
    if (totalPrice !== null && nights > 0) {
      priceFrom = Math.round((totalPrice / nights) * 100) / 100;
    }
  }

  // Extract rate plan labels from <h4> elements inside options div
  const ratePlans: Array<{ label: string }> = [];
  const optionsDivMatch = sectionHtml.match(
    /<div[^>]*class="options[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/
  );
  if (optionsDivMatch) {
    const optionsHtml = optionsDivMatch[1];
    const h4Pattern = /<h4[^>]*>(.*?)<\/h4>/gs;
    let h4Match: RegExpExecArray | null;
    while ((h4Match = h4Pattern.exec(optionsHtml)) !== null) {
      const label = stripTags(h4Match[1]).trim();
      if (label) ratePlans.push({ label });
    }
  }

  return {
    octorateRoomName,
    octorateRoomId,
    available: !isSoldOut,
    priceFrom: isSoldOut ? null : priceFrom,
    nights,
    ratePlans: isSoldOut ? [] : ratePlans,
  };
}

/**
 * Parse the full Octobook HTML page into an array of OctorateRoom objects.
 */
function parseOctobookHtml(html: string, nights: number): OctorateRoom[] {
  // Split by room section boundaries
  // Each room is wrapped in <section class="room animatedParent animateOnce">
  const sectionParts = html.split(/<section[^>]*class="room animatedParent animateOnce"[^>]*>/);

  // First element is content before any room section — skip it
  const roomSections = sectionParts.slice(1);

  return roomSections.map((section) => parseRoomSection(section, nights));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const fetchedAt = new Date().toISOString();

  // Fast path: feature flag disabled
  if (!OCTORATE_LIVE_AVAILABILITY) {
    return NextResponse.json<AvailabilityRouteResponse>({
      rooms: [],
      fetchedAt,
    });
  }

  const { searchParams } = new URL(request.url);
  const checkin = searchParams.get("checkin") ?? "";
  const checkout = searchParams.get("checkout") ?? "";
  const paxStr = searchParams.get("pax") ?? "1";
  const adultiStr = searchParams.get("adulti") ?? paxStr;

  // Validate params
  if (!checkin || !checkout || !isValidDate(checkin) || !isValidDate(checkout)) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const nights = countNights(checkin, checkout);
  if (nights <= 0) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const pax = parseInt(paxStr, 10) || 1;
  const adulti = parseInt(adultiStr, 10) || pax;

  // Build Octobook URL
  const octoUrl =
    `https://book.octorate.com/octobook/site/reservation/result.xhtml` +
    `?codice=${BOOKING_CODE}` +
    `&date=${encodeURIComponent(checkin)}` +
    `&checkin=${encodeURIComponent(checkin)}` +
    `&checkout=${encodeURIComponent(checkout)}` +
    `&pax=${pax}` +
    `&adulti=${adulti}` +
    `&lang=EN`;

  try {
    const response = await fetch(octoUrl, {
      next: { revalidate: 300 }, // 5-minute cache
      headers: {
        Accept: "text/html,application/xhtml+xml", // i18n-exempt -- BRIK-1 [ttl=2027-02-27] HTTP header value, server-side only
        "Accept-Language": "en-GB,en;q=0.9", // i18n-exempt -- BRIK-1 [ttl=2027-02-27] HTTP header value, server-side only
        "User-Agent":
          "Mozilla/5.0 (compatible; BriketteAvailabilityBot/1.0)", // i18n-exempt -- BRIK-1 [ttl=2027-02-27] HTTP header value, server-side only
      },
    });

    if (!response.ok) {
      console.error(
        `[availability] Octobook returned HTTP ${response.status} for ${octoUrl}`
      );
      return NextResponse.json<AvailabilityRouteResponse>({
        rooms: [],
        fetchedAt,
        error: "upstream_error",
      });
    }

    const html = await response.text();
    const rooms = parseOctobookHtml(html, nights);

    return NextResponse.json<AvailabilityRouteResponse>({ rooms, fetchedAt });
  } catch (err) {
    console.error("[availability] Octobook fetch error:", err);
    return NextResponse.json<AvailabilityRouteResponse>({
      rooms: [],
      fetchedAt,
      error: "upstream_error",
    });
  }
}
