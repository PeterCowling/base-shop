/// <reference types="@cloudflare/workers-types" />
// apps/shop-abc/src/routes/preview/[pageId].ts

import type { EventContext } from "@cloudflare/workers-types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@acme/config";

const secret = env.PREVIEW_TOKEN_SECRET;

function verify(
  id: string,
  token: string | null,
  upgrade: string | null
): boolean {
  if (!secret) return false;
  const check = (value: string | null, prefix = "") => {
    if (!value) return false;
    const digest = createHmac("sha256", secret)
      .update(`${prefix}${id}`)
      .digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(value));
    } catch {
      return false;
    }
  };
  return check(token) || check(upgrade, "upgrade:");
}

export const onRequest = async ({
  params,
  request,
}: EventContext<unknown, string, Record<string, unknown>>) => {
  const pageId = String(params.pageId);
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const upgrade = url.searchParams.get("upgrade");
  if (!verify(pageId, token, upgrade)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const shop = env.NEXT_PUBLIC_SHOP_ID || "default";
  const pages = await getPages(shop);
  const page = pages.find((p) => p.id === pageId);
  if (!page) return new Response("Not Found", { status: 404 });
  return Response.json(page);
};
