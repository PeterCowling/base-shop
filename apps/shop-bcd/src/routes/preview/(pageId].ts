/// <reference types="@cloudflare/workers-types" />

// apps/shop-bcd/src/routes/preview/[pageId].ts

import type { EventContext } from "@cloudflare/workers-types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { coreEnv } from "@acme/config/env/core";

const secret = coreEnv.PREVIEW_TOKEN_SECRET;

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
}: EventContext<unknown, string, Record<string, unknown>>) => {
  const pageId = String(params.pageId);
  const token = new URL(request.url).searchParams.get("token");
  if (!verify(pageId, token)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const shop = coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
  const pages = await getPages(shop);
  const page = pages.find((p) => p.id === pageId);
  if (!page) return new Response("Not Found", { status: 404 });
  return Response.json(page);
};
