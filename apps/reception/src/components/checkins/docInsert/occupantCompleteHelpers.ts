/**
 * src/components/docInsert/occupantCompleteHelpers.ts
 *
 * Helper functions to check whether occupant details
 * have all required fields to be considered “complete.”
 */

import {
  dateOfBirthSchema,
  occupantDetailsBaseSchema,
  occupantDocumentSchema,
} from "../../../schemas/occupantDetailsSchema";
import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";

export const occupantRequiredSchema = occupantDetailsBaseSchema
  .pick({
    firstName: true,
    lastName: true,
    gender: true,
    placeOfBirth: true,
    citizenship: true,
    municipality: true,
    document: true,
    dateOfBirth: true,
  })
  .required()
  .extend({
    document: occupantDocumentSchema.required(),
    dateOfBirth: dateOfBirthSchema,
  })
  .required();

/**
 * Returns true if all required occupant fields are populated.
 * This includes firstName, lastName, gender, placeOfBirth,
 * citizenship, municipality, document number & type, and
 * dateOfBirth with dd/mm/yyyy.
 */
export function occupantIsComplete(occupantDetails: OccupantDetails): boolean {
  if (!occupantDetails) return false;

  return occupantRequiredSchema.safeParse(occupantDetails).success;
}
