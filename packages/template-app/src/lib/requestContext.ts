import { headers } from "next/headers";

import { getShopIdFromHeaders } from "@acme/platform-core/shopContext";

export async function getRequestShopId(): Promise<string | null> {
  const hdrs = await headers();
  return getShopIdFromHeaders(hdrs);
}
