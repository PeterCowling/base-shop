// src/rooms/filters.ts
// -----------------------------------------------------------------------------
// Lightweight helpers to filter rooms collections.
// -----------------------------------------------------------------------------

import type { LocalizedRoom } from "./types";

export type RoomPredicate = (room: LocalizedRoom) => boolean;

/** Filter a list of rooms with a predicate. */
export function filterRooms(rooms: LocalizedRoom[], predicate: RoomPredicate): LocalizedRoom[] {
  return rooms.filter(predicate);
}

