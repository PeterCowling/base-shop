import { z } from "zod";

import { isValidDateParts } from "../utils/dateUtils";

const numericString = (pattern: RegExp, message: string) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return typeof val === "number" ? String(val) : val;
  }, z.string().regex(pattern, { message }));

// Variant that also accepts an empty string without failing validation.
const numericStringLoose = (pattern: RegExp, message: string) =>
  numericString(pattern, message).or(z.literal(""));

// Schema for date of birth fields
export const dateOfBirthSchema = z
  .object({
    yyyy: numericString(/^\d{4}$/, "Invalid year (YYYY).").optional(),
    mm: numericString(/^\d{1,2}$/, "Invalid month (MM).")
      .optional()
      .refine(
        (val) => {
          if (val === undefined) return true;

          const num = Number(val);
          return num >= 1 && num <= 12;
        },
        { message: "Month must be 01-12." }
      ),
    dd: numericString(/^\d{1,2}$/, "Invalid day (DD).")
      .optional()
      .refine(
        (val) => {
          if (val === undefined) return true;

          const num = Number(val);
          return num >= 1 && num <= 31;
        },
        { message: "Day must be 01-31." }
      ),
  })
  .refine(
    (data) => {
      const { yyyy, mm, dd } = data;
      if (!yyyy || !mm || !dd) return true;
      return isValidDateParts(yyyy, mm, dd);
    },
    { message: "Invalid date. Please re-check fields." }
  );

// Looser variant used for guests who are not checked in. It accepts empty
// strings for any date field but still validates when values are provided.
export const dateOfBirthLooseSchema = z
  .object({
    yyyy: numericStringLoose(/^\d{4}$/, "Invalid year (YYYY).").optional(),
    mm: numericStringLoose(/^\d{1,2}$/, "Invalid month (MM).")
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;

          const num = Number(val);
          return num >= 1 && num <= 12;
        },
        { message: "Month must be 01-12." }
      ),
    dd: numericStringLoose(/^\d{1,2}$/, "Invalid day (DD).")
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;

          const num = Number(val);
          return num >= 1 && num <= 31;
        },
        { message: "Day must be 01-31." }
      ),
  })
  .refine(
    (data) => {
      const { yyyy, mm, dd } = data;
      if (!yyyy || !mm || !dd) return true;
      return isValidDateParts(yyyy, mm, dd);
    },
    { message: "Invalid date. Please re-check fields." }
  );

// Schema for occupant document
export const occupantDocumentSchema = z.object({
  number: z.string().optional(),
  type: z.string().optional(),
});

export const occupantDetailsBaseSchema = z.object({
  citizenship: z.string().optional(),
  // Non checked-in guests may omit date fields, so use the loose variant here.
  dateOfBirth: dateOfBirthLooseSchema.optional(),
  document: occupantDocumentSchema.optional(),
  email: z.string().optional(),
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name required" })
    .optional(),
  gender: z.string().optional(),
  language: z.string().optional(),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name required" })
    .optional(),
  municipality: z.string().optional(),
  placeOfBirth: z.string().optional(),
  allocated: z.string().optional(),
});

// Use the base schema directly. Age validation is intentionally omitted
// because management may override age restrictions.
export const occupantDetailsSchema = occupantDetailsBaseSchema;
export type DateOfBirth = z.infer<typeof dateOfBirthSchema>;
export type OccupantDocument = z.infer<typeof occupantDocumentSchema>;
export type OccupantDetails = z.infer<typeof occupantDetailsSchema>;
export type OccupantDetailsSchema = z.infer<typeof occupantDetailsSchema>;
