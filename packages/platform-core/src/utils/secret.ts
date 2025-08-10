// packages/platform-core/src/utils/secret.ts
import { randomBytes } from "crypto";

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

