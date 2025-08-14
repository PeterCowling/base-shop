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
  ra: ReturnAuthorization,
): Promise<void> {
  await addReturnAuthorization(ra);
}
