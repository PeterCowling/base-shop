import { z } from "zod";

import { activitySchema } from "./activitySchema";
import { cityTaxRecordSchema } from "./cityTaxSchema";
import { occupantLoanDataSchema } from "./loansSchema";
import { mealPlanSchema } from "./mealPlanSchema";
import { occupantDetailsSchema } from "./occupantDetailsSchema";

const roomTransactionSchema = z.object({
  occupantId: z.string().optional(),
  bookingRef: z.string().optional(),
  amount: z.number(),
  nonRefundable: z.boolean().optional(),
  timestamp: z.string(),
  type: z.string().optional(),
});

const financialsRoomDataSchema = z.object({
  balance: z.number().default(0),
  totalDue: z.number().default(0),
  totalPaid: z.number().default(0),
  totalAdjust: z.number().default(0),
  transactions: z.record(roomTransactionSchema).default({}),
});

const occupantDateOfBirthSchema = z.object({
  dd: z.string().optional(),
  mm: z.string().optional(),
  yyyy: z.string().optional(),
});

export const checkInRowSchema = z.object({
  bookingRef: z.string(),
  occupantId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roomBooked: z.string().optional(),
  roomAllocated: z.string().optional(),
  financials: financialsRoomDataSchema.optional(),
  loans: z.record(occupantLoanDataSchema).optional(),
  activity: z.record(activitySchema).optional(),
  isFirstForBooking: z.boolean().optional(),
  mealPlans: mealPlanSchema.optional(),
  notes: z.string().optional(),
  occupantDetails: occupantDetailsSchema.optional(),
  cityTax: cityTaxRecordSchema.optional(),
  checkInDate: z.string(),
  checkOutDate: z.string().optional(),
  rooms: z.array(z.string()),
  actualCheckInTimestamp: z.string().optional(),
  activities: z.array(activitySchema).optional(),
  citizenship: z.string().optional(),
  placeOfBirth: z.string().optional(),
  dateOfBirth: occupantDateOfBirthSchema.optional(),
  municipality: z.string().optional(),
  gender: z.string().optional(),
  docNumber: z.string().optional(),
});

export type CheckInRow = z.infer<typeof checkInRowSchema>;
