import type { ReturnAuthorization } from "@acme/types";
import {
  addReturnAuthorization,
  readReturnAuthorizations,
  getReturnAuthorization,
} from "./repositories/returnAuthorization.server";

export { getReturnAuthorization };

export async function listReturnAuthorizations(): Promise<ReturnAuthorization[]> {
  return readReturnAuthorizations();
}

export async function createReturnAuthorization(
  ra: Omit<ReturnAuthorization, "raId">,
): Promise<string> {
  const raId = `RA${Date.now().toString(36).toUpperCase()}`;
  await addReturnAuthorization({ ...ra, raId });
  return raId;
}
