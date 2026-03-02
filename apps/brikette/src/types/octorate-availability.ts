export interface OctorateRoom {
  octorateRoomName: string;
  /** NOTE: always "3" in live Octobook HTML (JSF UI animation attribute) — do not use for room matching. */
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
