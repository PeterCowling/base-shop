/**
 * API Route: /api/check-in-lookup
 *
 * Staff-only endpoint to look up guest details by check-in code.
 * Returns minimal data (StaffCheckInView) for privacy.
 *
 * GET: Look up guest by check-in code
 */

import { get, ref } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';
import type { CheckInCodeRecord, StaffCheckInView } from '../../../types/checkInCode';
import { CHECK_IN_CODE_PATHS } from '../../../types/checkInCode';

/**
 * Default deposit amount (keycard deposit).
 */
const KEYCARD_DEPOSIT = 10; // EUR

/**
 * Format guest name for staff view (first name + last initial).
 */
function formatGuestName(firstName: string, lastName: string): string {
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

/**
 * GET /api/check-in-lookup
 * Look up guest details by check-in code.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Code parameter is required' },
      { status: 400 },
    );
  }

  // Log the lookup attempt (without PII)
  console.log(`[check-in-lookup] Code lookup: ${code} at ${new Date().toISOString()}`);

  try {
    // Look up the code in the byCode index
    const codePath = CHECK_IN_CODE_PATHS.byCode(code);
    const codeSnapshot = await get(ref(db, codePath));

    if (!codeSnapshot.exists()) {
      console.log(`[check-in-lookup] Code not found: ${code}`);
      return NextResponse.json(
        { error: 'Code not found' },
        { status: 404 },
      );
    }

    const codeRecord = codeSnapshot.val() as CheckInCodeRecord;

    // Check if code is expired
    if (codeRecord.expiresAt && codeRecord.expiresAt < Date.now()) {
      console.log(`[check-in-lookup] Code expired: ${code}`);
      return NextResponse.json(
        { error: 'Code expired' },
        { status: 410 },
      );
    }

    const { uuid } = codeRecord;

    // Fetch booking data for the guest
    // First, find the booking by checking bookings that have this occupant
    const bookingsRef = ref(db, 'bookings');
    const bookingsSnapshot = await get(bookingsRef);

    if (!bookingsSnapshot.exists()) {
      console.log(`[check-in-lookup] No bookings found`);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    const bookings = bookingsSnapshot.val() as Record<string, Record<string, unknown>>;

    // Find booking containing this uuid
    let guestData: StaffCheckInView | null = null;

    for (const [bookingCode, bookingData] of Object.entries(bookings)) {
      const occupants = bookingData.occupants as Record<string, boolean> | undefined;
      if (occupants && occupants[uuid]) {
        // Found the booking - fetch occupant details
        const occupantPath = `bookings/${bookingCode}/${uuid}`;
        const occupantSnapshot = await get(ref(db, occupantPath));

        if (occupantSnapshot.exists()) {
          const occupant = occupantSnapshot.val() as {
            firstName?: string;
            lastName?: string;
            room?: string;
            checkInDate?: string;
            checkOutDate?: string;
            nights?: number;
            cityTax?: { totalDue?: number };
          };

          // Fetch pre-arrival data for ETA
          const preArrivalPath = `preArrival/${uuid}`;
          const preArrivalSnapshot = await get(ref(db, preArrivalPath));
          const preArrival = preArrivalSnapshot.exists()
            ? (preArrivalSnapshot.val() as {
                etaWindow?: string | null;
                etaMethod?: string | null;
              })
            : null;

          guestData = {
            guestName: formatGuestName(
              occupant.firstName ?? 'Guest',
              occupant.lastName ?? '',
            ),
            roomAssignment: occupant.room ?? 'Not assigned',
            checkInDate: occupant.checkInDate ?? '',
            checkOutDate: occupant.checkOutDate ?? '',
            nights: occupant.nights ?? 1,
            cityTaxDue: occupant.cityTax?.totalDue ?? 0,
            depositDue: KEYCARD_DEPOSIT,
            etaWindow: preArrival?.etaWindow ?? null,
            etaMethod: preArrival?.etaMethod ?? null,
          };
          break;
        }
      }
    }

    if (!guestData) {
      console.log(`[check-in-lookup] Guest data not found for uuid: ${uuid.substring(0, 8)}...`);
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 },
      );
    }

    console.log(`[check-in-lookup] Successful lookup for code: ${code}`);
    return NextResponse.json(guestData);
  } catch (error) {
    console.error('[check-in-lookup] Error:', error);
    return NextResponse.json(
      { error: 'Lookup failed' },
      { status: 500 },
    );
  }
}
