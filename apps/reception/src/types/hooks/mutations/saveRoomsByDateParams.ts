/* src/types/hooks/mutations/saveRoomsByDateParams.ts */

/**
 * Interface for the parameters used when saving occupant moves across
 * old/new date or room references.
 */
export interface SaveRoomsByDateParams {
  oldDate: string | null;
  oldRoom: string | null;
  oldBookingRef: string | null;
  oldGuestId: string; // occupantId

  newDate: string | null;
  newRoom: string | null;
  newBookingRef: string | null;
  newGuestId: string; // occupantId
}
