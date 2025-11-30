// apps/cover-me-pretty/src/routes/preview/[pageId].ts

import type { EventContext } from "@cloudflare/workers-types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { createHmac, timingSafeEqual } from "crypto";
import { coreEnv as env } from "@acme/config/env/core";

const secret = env.PREVIEW_TOKEN_SECRET;
const upgradeSecret = env.UPGRADE_PREVIEW_TOKEN_SECRET;

function verify(
  id: string,
  token: string | null,
  key: string | undefined,
): boolean {
  if (!key || !token) return false;
  const digest = createHmac("sha256", key).update(id).digest("hex");
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
  const search = new URL(request.url).searchParams;
  const upgradeToken = search.get("upgrade");
  const token = search.get("token");
  if (upgradeToken) {
    if (!verify(pageId, upgradeToken, upgradeSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (!verify(pageId, token, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const shop = env.NEXT_PUBLIC_SHOP_ID || "default";
  const pages = await getPages(shop);
  const page = pages.find((p) => p.id === pageId);
  if (!page) return new Response("Not Found", { status: 404 });
  return Response.json(page);
};
