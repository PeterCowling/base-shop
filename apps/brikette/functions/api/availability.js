// apps/brikette/functions/api/availability.js
// Cloudflare Pages Function proxy for the public Octobook booking engine HTML endpoint.
// Parses room availability and pricing from rendered HTML.

const BOOKING_CODE = "45111"; // keep in sync with apps/brikette/src/context/modal/constants.ts

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** Count calendar days between two YYYY-MM-DD date strings. */
function countNights(checkin, checkout) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / msPerDay
  );
}

/** Validate that a string is a well-formed YYYY-MM-DD date. */
function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

/**
 * Parse the Octobook price string into a numeric total (EUR).
 * Returns null if no valid price found.
 */
function parseTotalPrice(offertText) {
  const text = offertText.replace(/&euro;/gi, "€");
  const match = text.match(/€\s*([\d]+)\s*[,.](\d+)/);
  if (!match) return null;

  const intPart = match[1];
  const fracPart = match[2];
  const total = parseFloat(`${intPart}.${fracPart}`);
  return Number.isNaN(total) ? null : total;
}

/** Extract all text content from a raw HTML fragment (strips tags). */
function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse a single room section HTML fragment into a room object. */
function parseRoomSection(sectionHtml, nights) {
  const h1Match = sectionHtml.match(
    /<h1[^>]*class="animated fadeInDownShort"[^>]*data-id="([^"]*)"[^>]*>([\s\S]*?)<\/h1>/
  );
  const octorateRoomId = h1Match ? h1Match[1].trim() : "";
  const octorateRoomName = h1Match ? stripTags(h1Match[2]).trim() : "Unknown";

  const offertMatch = sectionHtml.match(/<div[^>]*class="offert"[^>]*>([\s\S]*?)<\/div>/);
  const offertHtml = offertMatch ? offertMatch[1] : "";
  const offertText = stripTags(offertHtml);

  const isSoldOut =
    offertText.includes("Not available") || // i18n-exempt -- BRIK-1 [ttl=2027-02-27] Octobook HTML sentinel string, server-side only
    offertText.includes("No availability"); // i18n-exempt -- BRIK-1 [ttl=2027-02-27] Octobook HTML sentinel string, server-side only

  let priceFrom = null;
  if (!isSoldOut) {
    const totalPrice = parseTotalPrice(offertText);
    if (totalPrice !== null && nights > 0) {
      priceFrom = Math.round((totalPrice / nights) * 100) / 100;
    }
  }

  const ratePlans = [];
  const optionsDivMatch = sectionHtml.match(
    /<div[^>]*class="options[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/
  );
  if (optionsDivMatch) {
    const optionsHtml = optionsDivMatch[1];
    const h4Pattern = /<h4[^>]*>(.*?)<\/h4>/gs;
    let h4Match;
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

/** Parse the full Octobook HTML page into room objects. */
function parseOctobookHtml(html, nights) {
  const sectionParts = html.split(/<section[^>]*class="room animatedParent animateOnce"[^>]*>/);
  const roomSections = sectionParts.slice(1);
  return roomSections.map((section) => parseRoomSection(section, nights));
}

export async function onRequestGet(context) {
  const fetchedAt = new Date().toISOString();

  if (context.env.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY !== "1") {
    return jsonResponse({
      rooms: [],
      fetchedAt,
    });
  }

  const { searchParams } = new URL(context.request.url);
  const checkin = searchParams.get("checkin") || "";
  const checkout = searchParams.get("checkout") || "";
  const paxStr = searchParams.get("pax") || "1";
  const adultiStr = searchParams.get("adulti") || paxStr;

  if (!checkin || !checkout || !isValidDate(checkin) || !isValidDate(checkout)) {
    return jsonResponse({ error: "missing_params" }, 400);
  }

  const nights = countNights(checkin, checkout);
  if (nights <= 0) {
    return jsonResponse({ error: "invalid_range" }, 400);
  }

  const pax = parseInt(paxStr, 10) || 1;
  const adulti = parseInt(adultiStr, 10) || pax;

  const octoUrl =
    "https://book.octorate.com/octobook/site/reservation/result.xhtml" +
    `?codice=${BOOKING_CODE}` +
    `&date=${encodeURIComponent(checkin)}` +
    `&checkin=${encodeURIComponent(checkin)}` +
    `&checkout=${encodeURIComponent(checkout)}` +
    `&pax=${pax}` +
    `&adulti=${adulti}` +
    "&lang=EN";

  try {
    const response = await fetch(octoUrl, {
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
      return jsonResponse({
        rooms: [],
        fetchedAt,
        error: "upstream_error",
      });
    }

    const html = await response.text();
    const rooms = parseOctobookHtml(html, nights);
    return jsonResponse({ rooms, fetchedAt });
  } catch (err) {
    console.error("[availability] Octobook fetch error:", err);
    return jsonResponse({
      rooms: [],
      fetchedAt,
      error: "upstream_error",
    });
  }
}
