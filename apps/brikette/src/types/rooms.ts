// src/types/rooms.ts
//
// — Centralised domain types for the “rooms” feature —
// ----------------------------------------------------
export type RateType = "nonRefundable" | "refundable";

export interface RoomImageSet {
  /** Small/optimised image shown inside a <RoomCard>. */
  card: string;
  /** Full-size version opened in <FullscreenImage>. */
  full: string;
}

export interface Room {
  id: string;
  images: RoomImageSet[];
}
