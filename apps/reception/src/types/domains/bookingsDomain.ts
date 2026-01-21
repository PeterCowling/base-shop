// src/tpyes/domains/bookingsDomain

/**
 * Represents a more advanced Booking structure for usage in other parts of the application
 * (e.g., financials, activities, etc.).
 *
 *   bookingRef: "4092716050",            // Unique reservation code
 *   occupantId: "occ_1740508445159",       // Unique identifier for the occupant
 *   firstName: "John",                   // Optional first name of the occupant
 *   lastName: "Doe"                      // Optional last name of the occupant
 */
export interface Booking {
  bookingRef: string;
  occupantId: string;
  firstName?: string;
  lastName?: string;
}
