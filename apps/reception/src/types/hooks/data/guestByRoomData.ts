// File: /src/types/hooks/data/guestByRoomData.ts

import type { GuestByRoomRecord } from "../../../schemas/guestByRoomSchema";

export type { GuestByRoomRecord };

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
