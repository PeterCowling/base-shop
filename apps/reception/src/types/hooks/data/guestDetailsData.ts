// /src/types/hooks/data/guestDetailsData.ts

import { type z } from "zod";

import type {
  bookingOccupantDetailsSchema,
  guestsDetailsSchema,
} from "../../../schemas/guestsDetailsSchema";
import type {
  DateOfBirth,
  OccupantDetails,
  OccupantDocument,
} from "../../../schemas/occupantDetailsSchema";

export type { DateOfBirth, OccupantDetails, OccupantDocument };

/**
 * Maps occupantId to its corresponding OccupantDetails.
 */
export type BookingOccupantDetails = z.infer<
  typeof bookingOccupantDetailsSchema
>;

/**
 * Complete structure for storing guest details,
 * organized by booking reference and occupant ID.
 *
 * guestsDetails -> bookingRef -> occupantId -> OccupantDetails
 */
export type GuestsDetails = z.infer<typeof guestsDetailsSchema>;
