// apps/shop-bcd/src/routes/preview/[pageId].t

import type { EventContext } from "@cloudflare/workers-types";
import { getPages } from "@platform-core/repositories/pages";
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = process.env.PREVIEW_TOKEN_SECRET;

function verify(id: string, token: string | null): boolean {
  if (!secret || !token) return false;
  const digest = createHmac("sha256", secret).update(id).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(token));
  } catch {
    return false;
  }
}

export const onRequest = async ({
  params,
  request,
}: EventContext<unknown, any, Record<string, unknown>>) => {
  const pageId = String(params.pageId);
  const token = new URL(request.url).searchParams.get("token");
  if (!verify(pageId, token)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const pages = await getPages(shop);
  const page = pages.find((p) => p.id === pageId);
  if (!page) return new Response("Not Found", { status: 404 });
  return Response.json(page);
};
