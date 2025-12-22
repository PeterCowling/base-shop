// src/rooms/types.ts
// -----------------------------------------------------------------------------
// Shared Room domain types used across pricing/availability/catalogue.
// -----------------------------------------------------------------------------

import type { Room, RoomId } from "@/data/roomsData";
import type { RoomAmenity } from "@/types/machine-layer/ml";

export interface RoomCopy {
  id: RoomId;
  title: string;
  intro: string;
  description: string;
  facilityKeys: string[];
  amenities: RoomAmenity[];
}

export interface LocalizedRoom extends Room {
  title: string;
  intro: string;
  description: string;
  facilityKeys: string[];
  amenities: RoomAmenity[];
}

