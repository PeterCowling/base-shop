import { randomBytes } from "crypto";

/** Convert a string into a URL-friendly slug. */
export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
