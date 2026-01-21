import type { ReturnAuthorization } from "@acme/types";

import { getReturnAuthorization } from "./repositories/returnAuthorization.server";

export { getTrackingStatus, type TrackingStatus, type TrackingStatusRequest, type TrackingStep, } from "./shipping/index.js";
export { getReturnAuthorization };
export declare function listReturnAuthorizations(): Promise<ReturnAuthorization[]>;
export declare function createReturnAuthorization({ orderId, status, inspectionNotes, }: {
    orderId: string;
    status?: ReturnAuthorization["status"];
    inspectionNotes?: string;
}): Promise<ReturnAuthorization>;
