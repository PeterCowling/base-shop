import "server-only";

import { FIREBASE_BASE_URL } from "../../utils/emailConstants";

function requireFirebaseBaseUrl(): string {
  const base = FIREBASE_BASE_URL?.trim();
  if (!base) {
    throw new Error("FIREBASE_BASE_URL is not configured");
  }
  return base.replace(/\/+$/, "");
}

export function buildFirebaseUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = requireFirebaseBaseUrl();
  const secret = process.env.FIREBASE_DB_SECRET?.trim();
  const url = `${base}${normalizedPath}.json`;
  return secret ? `${url}?auth=${encodeURIComponent(secret)}` : url;
}

export async function fetchFirebaseJson(path: string): Promise<unknown> {
  const response = await fetch(buildFirebaseUrl(path));
  if (!response.ok) {
    throw new Error(`Firebase request failed for ${path}: HTTP ${response.status}`);
  }
  return response.json();
}
