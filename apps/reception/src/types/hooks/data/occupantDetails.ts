// src/types/occupantDetails.ts

/** Date of birth fields. */
export interface DateOfBirth {
  yyyy?: string;
  mm?: string;
  dd?: string;
}

/** Occupant document information. */
export interface OccupantDocument {
  number?: string;
  type?: string;
}

/** Comprehensive occupant details. */
export interface OccupantDetails {
  citizenship?: string;
  dateOfBirth?: DateOfBirth;
  document?: OccupantDocument;
  email?: string;
  firstName?: string;
  gender?: string;
  language?: string;
  lastName?: string;
  municipality?: string;
  placeOfBirth?: string;
  allocated?: string;
}
