// packages/template-app/src/routes/preview/[pageId].ts

import type { EventContext } from "@cloudflare/workers-types";
import { getPages } from "@acme/platform-core/repositories/pages/index.server";
import { coreEnv } from "@acme/config/env/core";
import {
  verifyPreviewToken,
  verifyUpgradePreviewToken,
} from "@acme/platform-core/previewTokens";

const {
  PREVIEW_TOKEN_SECRET,
  UPGRADE_PREVIEW_TOKEN_SECRET,
  NEXT_PUBLIC_SHOP_ID,
} = coreEnv as {
  PREVIEW_TOKEN_SECRET?: string;
  UPGRADE_PREVIEW_TOKEN_SECRET?: string;
  NEXT_PUBLIC_SHOP_ID?: string;
};

export const onRequest = async ({
  params,
  request,
}: EventContext<unknown, string, Record<string, unknown>>) => {
  const pageId = String(params.pageId);
  const search = new URL(request.url).searchParams;
  const upgradeToken = search.get("upgrade");
  const token = search.get("token");
  const shopId = NEXT_PUBLIC_SHOP_ID || "default";

  if (upgradeToken) {
    if (
      !verifyUpgradePreviewToken(
        upgradeToken,
        { shopId, pageId },
        UPGRADE_PREVIEW_TOKEN_SECRET,
      )
    ) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (
    !verifyPreviewToken(token, { shopId, pageId }, PREVIEW_TOKEN_SECRET)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pages = await getPages(shopId);
  const page = pages.find((p) => p.id === pageId);
  if (!page) return new Response("Not Found", { status: 404 });
  return Response.json(page);
};
