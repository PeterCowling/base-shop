export interface OctorateRoom {
  octorateRoomName: string;
  octorateRoomId: string;
  available: boolean;
  priceFrom: number | null;
  nights: number;
  ratePlans: Array<{ label: string }>;
}

export interface AvailabilityRouteResponse {
  rooms: OctorateRoom[];
  fetchedAt: string;
  error?: string;
}
