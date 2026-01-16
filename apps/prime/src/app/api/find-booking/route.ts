/**
 * API Route: /api/find-booking
 *
 * Public endpoint for guests to look up their booking by code + last name.
 * Returns redirect URL only (no PII exposed).
 *
 * Security:
 * - Rate limited (5 requests per IP per 15 minutes)
 * - Case-insensitive last name matching
 * - Generic error messages (no enumeration info)
 * - Logs all attempts (IP, timestamp, booking code - NOT last name)
 *
 * POST: Look up booking and return redirect URL
 */

import { get, ref } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';
import type { GuestsDetails } from '../../../types/guestsDetails';

/**
 * Simple in-memory rate limiter.
 * In production, consider using @upstash/ratelimit with Redis.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt < now) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

/**
 * Get client IP from request headers.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback - in Vercel/Cloudflare this header is set
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Normalize string for comparison (lowercase, trim whitespace).
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * POST /api/find-booking
 * Look up booking by code + last name, return redirect URL if matched.
 *
 * Body: { bookingCode: string, lastName: string }
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  // Rate limiting
  const { allowed, remaining } = checkRateLimit(clientIp);
  if (!allowed) {
    console.log(
      `[find-booking] Rate limited: IP=${clientIp} at ${new Date().toISOString()}`,
    );
    return NextResponse.json(
      { success: false, error: 'Too many attempts' },
      {
        status: 429,
        headers: {
          'Retry-After': '900', // 15 minutes
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  try {
    const body = await request.json();
    const { bookingCode, lastName } = body as {
      bookingCode: string;
      lastName: string;
    };

    // Validate input
    if (!bookingCode || !lastName) {
      console.log(
        `[find-booking] Invalid input: IP=${clientIp} at ${new Date().toISOString()}`,
      );
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        {
          status: 400,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      );
    }

    // Log the attempt (no PII - just booking code and IP)
    console.log(
      `[find-booking] Lookup attempt: code=${bookingCode} IP=${clientIp} at ${new Date().toISOString()}`,
    );

    // Normalize booking code
    const normalizedCode = bookingCode.toUpperCase().trim();
    const normalizedLastName = normalizeString(lastName);

    // Check if booking exists
    const bookingsRef = ref(db, `bookings/${normalizedCode}`);
    const bookingsSnapshot = await get(bookingsRef);

    if (!bookingsSnapshot.exists()) {
      console.log(`[find-booking] Booking not found: code=${normalizedCode}`);
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        {
          status: 404,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      );
    }

    // Get guest details for this booking
    const guestDetailsRef = ref(db, `guestsDetails/${normalizedCode}`);
    const guestDetailsSnapshot = await get(guestDetailsRef);

    if (!guestDetailsSnapshot.exists()) {
      console.log(`[find-booking] Guest details not found for: ${normalizedCode}`);
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        {
          status: 404,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      );
    }

    // Look for a matching last name among occupants
    const guestDetails = guestDetailsSnapshot.val() as GuestsDetails[string];
    let matchedUuid: string | null = null;

    for (const [uuid, occupant] of Object.entries(guestDetails)) {
      const occupantLastName = normalizeString(occupant.lastName || '');
      if (occupantLastName === normalizedLastName) {
        matchedUuid = uuid;
        break;
      }
    }

    if (!matchedUuid) {
      console.log(
        `[find-booking] Last name mismatch for booking: ${normalizedCode}`,
      );
      // Return generic error - don't reveal that booking exists
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        {
          status: 404,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      );
    }

    // Success - return redirect URL (no PII)
    console.log(
      `[find-booking] Match found: code=${normalizedCode} uuid=${matchedUuid.substring(0, 8)}...`,
    );

    // The redirect URL uses the uuid to authenticate the guest
    const redirectUrl = `/?uuid=${matchedUuid}`;

    return NextResponse.json(
      {
        success: true,
        redirectUrl,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    );
  } catch (error) {
    console.error('[find-booking] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Lookup failed' },
      { status: 500 },
    );
  }
}
