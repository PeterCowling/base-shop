// /src/types/guestByRoom.ts
// Type definitions for the "guestByRoom" node in Firebase.
//
// Structure example:
// "guestByRoom": {
//   "<occupant_id>": {
//     "allocated": "<string>",
//     "booked": "<string>"
//   }
// }

import { IndexedById } from './indexedById';

/**
 * Represents the allocated and originally booked room numbers for an occupant.
 * "allocated" = current room,
 * "booked" = originally booked room.
 */
export interface GuestByRoomRecord {
  allocated: string;
  booked: string;
}

/**
 * The shape of the "guestByRoom" node, with occupantId as the key,
 * and an object containing "allocated" and "booked" as the value.
 */
export type GuestByRoom = IndexedById<GuestByRoomRecord>;
