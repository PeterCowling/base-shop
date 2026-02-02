import { headers } from "next/headers";
import {
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
