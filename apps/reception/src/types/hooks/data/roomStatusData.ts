// src/types/hooks/data/roomStatusData.ts

export type Cleanliness = "Clean" | "Dirty";

export interface SingleRoomStatus {
  /** Date/time that the room was fully vacated, or false if guests still occupy it. */
  checkedout?: string | false;

  /**
   * Simple flag indicating if the room is considered "clean."
   * E.g. "Yes" or false.
   */
  clean?: string | false;

  /** Timestamp of last actual cleaning, or false if never cleaned. */
  cleaned?: string | false;
}

/** A map of room_number -> SingleRoomStatus. */
export type RoomStatus = Record<string, SingleRoomStatus> | null;
