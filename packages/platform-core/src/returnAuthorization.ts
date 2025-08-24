import type { ReturnAuthorization } from "@acme/types";
import {
  addReturnAuthorization,
  readReturnAuthorizations,
  getReturnAuthorization,
} from "./repositories/returnAuthorization.server";
export {
  getTrackingStatus,
  type TrackingStatusRequest,
  type TrackingStatus,
  type TrackingStep,
} from "./shipping/index";

export { getReturnAuthorization };

export async function listReturnAuthorizations(): Promise<ReturnAuthorization[]> {
  return readReturnAuthorizations();
}

export async function createReturnAuthorization({
  orderId,
  status = "pending",
  inspectionNotes = "",
}: {
  orderId: string;
  status?: ReturnAuthorization["status"];
  inspectionNotes?: string;
}): Promise<ReturnAuthorization> {
  const ra: ReturnAuthorization = {
    raId: `RA${Date.now().toString(36).toUpperCase()}`,
    orderId,
    status,
    inspectionNotes,
  };
  await addReturnAuthorization(ra);
  return ra;
}
