import { headers } from "next/headers";
import {
  getExternalOriginFromHeaders,
  getShopIdFromHeaders,
  requireShopIdFromHeaders,
} from "@platform-core/shopContext";

export async function getRequestShopId(): Promise<string | null> {
  const hdrs = await headers();
  return getShopIdFromHeaders(hdrs);
}

export async function requireRequestShopId(): Promise<string> {
  const hdrs = await headers();
  return requireShopIdFromHeaders(hdrs);
}

export async function getRequestOrigin(fallbackOrigin = "http://localhost:3000"): Promise<string> {
  const hdrs = await headers();
  return getExternalOriginFromHeaders(hdrs, fallbackOrigin);
}
