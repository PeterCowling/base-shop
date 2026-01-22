import "@acme/zod-utils/initZod";

import { type NextRequest, NextResponse } from "next/server";
import { ensureShopAccess } from "@cms/actions/common/auth";
import path from "path";
import { z } from "zod";

import { validateShopName } from "@acme/lib";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";

import { writeJsonFile } from "@/lib/server/jsonIO";

const ParamsSchema = z
  .object({ shop: z.string(), code: z.string().optional() })
  .strict();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const url = new URL(req.url);
  const parsed = ParamsSchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success || !parsed.data.shop) {
    return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
  }

  // Validate shop name to prevent path traversal
  let shop: string;
  try {
    shop = validateShopName(parsed.data.shop);
  } catch {
    return NextResponse.json({ error: "Invalid shop name" }, { status: 400 });
  }

  // Require authenticated session with access to this specific shop
  try {
    await ensureShopAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }

  const { code } = parsed.data;

  if (!code) {
    const redirectParams = new URLSearchParams({ shop, code: "dummy-token" });
    const redirect = `${url.origin}/cms/api/providers/${provider}?${redirectParams.toString()}`;
    return NextResponse.redirect(redirect);
  }

  const dir = path.join(resolveDataRoot(), shop);
  await writeJsonFile(path.join(dir, `${provider}.json`), { token: code });

  return NextResponse.redirect(`/cms/configurator?connected=${provider}`);
}
