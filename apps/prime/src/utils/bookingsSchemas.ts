// File: /src/utils/bookingsSchemas.ts

import { z } from 'zod';
import { zodErrorToString } from './zodErrorToString';

/* -------------------------------------------------------------------------- */
/*                                SCHEMA CORE                                 */
/* -------------------------------------------------------------------------- */

/**
 * Details about a single occupant within a booking.
 */
export const bookingOccupantDataSchema = z.object({
  checkInDate: z.string(),
  checkOutDate: z.string(),
  leadGuest: z.boolean(),
  roomNumbers: z.array(z.string()),
});

/**
 * Record keyed by occupant UUID → occupant details.
 *
 * {
 *   "<uuid>": { ...bookingOccupantData }
 * }
 */
export const bookingOccupantsRecordSchema = z.record(
  z.string(), // key: occupant UUID
  bookingOccupantDataSchema, // value: occupant details
);

/**
 * Full bookings dataset.
 *
 * {
 *   "<reservationCode>": {
 *     "<uuid>": { ...bookingOccupantData }
 *   }
 * }
 */
export const bookingsDataSchema = z.record(
  z.string(), // key: reservation code
  bookingOccupantsRecordSchema, // value: occupants record
);

/* -------------------------------------------------------------------------- */
/*                                 TYPE ALIASES                               */
/* -------------------------------------------------------------------------- */

export type BookingOccupantsRecord = z.infer<
  typeof bookingOccupantsRecordSchema
>;
export type BookingsData = z.infer<typeof bookingsDataSchema>;
export type BookingOccupantData = z.infer<typeof bookingOccupantDataSchema>;

/* -------------------------------------------------------------------------- */
/*                               PARSE HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Validate and parse a single occupant object **with console logging**.
 */
export const parseBookingOccupantData = (
  data: unknown,
): BookingOccupantData => {
  const result = bookingOccupantDataSchema.safeParse(data);

  if (result.success) {
    console.debug(
      '[bookingsSchemas] ✅ bookingOccupantData valid:',
      result.data,
    );
    return result.data;
  }

  console.error(
    '[bookingsSchemas] ❌ bookingOccupantData invalid:',
    zodErrorToString(result.error),
  );
  throw result.error;
};

/**
 * Validate and parse the full occupants record **with console logging**.
 */
export const parseBookingOccupantsRecord = (
  data: unknown,
): BookingOccupantsRecord => {
  const result = bookingOccupantsRecordSchema.safeParse(data);

  if (result.success) {
    console.debug(
      '[bookingsSchemas] ✅ bookingOccupantsRecord valid:',
      result.data,
    );
    return result.data;
  }

  console.error(
    '[bookingsSchemas] ❌ bookingOccupantsRecord invalid:',
    zodErrorToString(result.error),
  );
  throw result.error;
};

/**
 * Validate and parse the complete bookings dataset **with console logging**.
 */
export const parseBookingsData = (data: unknown): BookingsData => {
  const result = bookingsDataSchema.safeParse(data);

  if (result.success) {
    console.debug('[bookingsSchemas] ✅ bookingsData valid:', result.data);
    return result.data;
  }

  console.error(
    '[bookingsSchemas] ❌ bookingsData invalid:',
    zodErrorToString(result.error),
  );
  throw result.error;
};
