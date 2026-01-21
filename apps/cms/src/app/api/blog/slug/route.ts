import { type NextRequest, NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";

import { cmsEnv as env } from "@acme/config/env/cms";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";

export const runtime = "nodejs";

const apiVersion =
  (env.SANITY_API_VERSION as string | undefined) ?? "2021-10-21";

interface Config {
  projectId: string;
  dataset: string;
  token?: string;
  apiVersion: string;
}

function queryUrl(config: Config, query: string) {
  return `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;
}

export async function GET(req: NextRequest) {
  await ensureAuthorized();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const shopId = searchParams.get("shopId");
  const excludeId = searchParams.get("exclude");
  if (!slug || !shopId) {
    return NextResponse.json({ error: "Missing slug or shopId" }, { status: 400 });
  }
  const shop = await getShopById(shopId);
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
  const sanity = getSanityConfig(shop) as
    | { projectId: string; dataset: string; token?: string }
    | undefined;
  if (!sanity || !sanity.projectId || !sanity.dataset) {
    return NextResponse.json({ error: "Missing Sanity config" }, { status: 400 });
  }
  const config: Config = { ...sanity, apiVersion };
  const query = `*[_type=="post" && slug.current=="${slug}"${excludeId ? ` && _id!="${excludeId}"` : ""}][0]{_id}`;
  const res = await fetch(queryUrl(config, query), {
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
  });
  const json = await res.json();
  return NextResponse.json({ exists: Boolean(json.result) });
}
