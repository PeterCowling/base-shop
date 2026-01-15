// File: /src/types/hooks/data/guestByRoomData.ts

/**
 * Represents the room allocation data for a single occupant within the "guestByRoom" node.
 *
 *   allocated: "6", // The room number currently assigned
 *   booked: "6"    // The room number originally booked
 */
export interface GuestByRoomRecord {
  allocated: string;
  booked: string;
}

/**
 * A map of occupantId -> GuestByRoomRecord.
 *
 *   "occ_1740508445159": {
 *     allocated: "6",
 *     booked: "6"
 *   }
 */
export interface GuestByRoomData {
  [occupantId: string]: GuestByRoomRecord;
}

/**
 * The entire "guestByRoom" node. It may be null if there is no data.
 *
 *   "guestByRoom": {
 *     "occ_1740508445159": {
 *       allocated: "6",
 *       booked: "6"
 *     },
 *     "occ_1740509104577": {
 *       allocated: "4",
 *       booked: "4"
 *     }
 *   }
 */
export type GuestByRoom = GuestByRoomData | null;
