// File: src/types/roomview.ts

export interface MergedOccupant {
  occupantId: string;
  bookingRef: string;
  roomNumber: string | number;
  date: string;

  // Unify occupant fields
  fullName: string;
  startIndex: number;
  endIndex: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  color: string;

  // These two fields are required according to your interface:
  start: string;
  end: string;
}

/**
 * Date-based occupancy:
 *   { [date: string]: { [roomNumber: string]: MergedOccupant[] } }
 */
export interface MergedOccupancyData {
  [date: string]: {
    [roomNumber: string]: MergedOccupant[];
  };
}

/**
 * Room-based occupancy:
 *   { [roomNumber: string]: MergedOccupant[] }
 */
export interface RoomOccupancyData {
  [roomNumber: string]: MergedOccupant[];
}
