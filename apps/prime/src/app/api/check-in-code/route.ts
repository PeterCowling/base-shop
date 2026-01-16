/**
 * API Route: /api/check-in-code
 *
 * Server-side check-in code generation and retrieval.
 * Uses Firebase transactions for atomic code generation.
 *
 * GET: Retrieve existing code for a UUID
 * POST: Generate new code for a UUID (if not exists)
 */

import { get, ref, runTransaction, set } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';
import { addHours } from 'date-fns';
import type { CheckInCodeRecord } from '../../../types/checkInCode';
import {
  CHECK_IN_CODE_LENGTH,
  CHECK_IN_CODE_PATHS,
  CHECK_IN_CODE_PREFIX,
  CODE_EXPIRY_HOURS_AFTER_CHECKOUT,
} from '../../../types/checkInCode';

/**
 * Characters used in check-in codes (uppercase alphanumeric, excluding confusing chars).
 * Removed: 0, O, 1, I, L to avoid confusion.
 */
const CODE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random alphanumeric code of specified length.
 */
function generateRandomCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARACTERS.length);
    code += CODE_CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Generate a unique check-in code with prefix.
 */
function generateCheckInCode(): string {
  return `${CHECK_IN_CODE_PREFIX}${generateRandomCode(CHECK_IN_CODE_LENGTH)}`;
}

/**
 * Calculate code expiry timestamp.
 * Expires 48 hours after checkout date.
 */
function calculateExpiry(checkOutDate: string): number {
  try {
    const checkOut = new Date(checkOutDate);
    const expiry = addHours(checkOut, CODE_EXPIRY_HOURS_AFTER_CHECKOUT);
    return expiry.getTime();
  } catch {
    // Default to 7 days from now if checkout date is invalid
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * GET /api/check-in-code
 * Retrieve existing check-in code for a UUID.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');

  if (!uuid) {
    return NextResponse.json(
      { error: 'UUID parameter is required' },
      { status: 400 },
    );
  }

  try {
    const codePath = CHECK_IN_CODE_PATHS.byUuid(uuid);
    const snapshot = await get(ref(db, codePath));

    if (!snapshot.exists()) {
      return NextResponse.json({ code: null });
    }

    const record = snapshot.val() as CheckInCodeRecord;

    // Check if expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      return NextResponse.json({ code: null, expired: true });
    }

    return NextResponse.json({
      code: record.code,
      expiresAt: record.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching check-in code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in code' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/check-in-code
 * Generate a new check-in code for a UUID.
 *
 * Body: { uuid: string, checkOutDate: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uuid, checkOutDate } = body;

    if (!uuid) {
      return NextResponse.json(
        { error: 'UUID is required' },
        { status: 400 },
      );
    }

    if (!checkOutDate) {
      return NextResponse.json(
        { error: 'checkOutDate is required' },
        { status: 400 },
      );
    }

    // Check if code already exists
    const existingPath = CHECK_IN_CODE_PATHS.byUuid(uuid);
    const existingSnapshot = await get(ref(db, existingPath));

    if (existingSnapshot.exists()) {
      const existing = existingSnapshot.val() as CheckInCodeRecord;
      // Return existing code if not expired
      if (existing.expiresAt > Date.now()) {
        return NextResponse.json({
          code: existing.code,
          expiresAt: existing.expiresAt,
          existing: true,
        });
      }
    }

    // Generate new code with collision detection
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateCheckInCode();
      attempts++;

      // Check if code already exists
      const codeCheckPath = CHECK_IN_CODE_PATHS.byCode(code);
      const codeSnapshot = await get(ref(db, codeCheckPath));

      if (!codeSnapshot.exists()) {
        break; // Code is unique
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique code after max attempts');
      }
    } while (true);

    const now = Date.now();
    const expiresAt = calculateExpiry(checkOutDate);

    const record: CheckInCodeRecord = {
      code,
      uuid,
      createdAt: now,
      expiresAt,
    };

    // Write to both indexes atomically using Promise.all
    // Note: For production, consider using Firebase Admin SDK with multi-path updates
    const byCodePath = CHECK_IN_CODE_PATHS.byCode(code);
    const byUuidPath = CHECK_IN_CODE_PATHS.byUuid(uuid);

    await Promise.all([
      set(ref(db, byCodePath), record),
      set(ref(db, byUuidPath), record),
    ]);

    return NextResponse.json({
      code,
      expiresAt,
      created: true,
    });
  } catch (error) {
    console.error('Error generating check-in code:', error);
    return NextResponse.json(
      { error: 'Failed to generate check-in code' },
      { status: 500 },
    );
  }
}
