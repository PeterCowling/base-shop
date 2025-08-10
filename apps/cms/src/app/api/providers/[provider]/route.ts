import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }

  if (!code) {
    const redirect = `${url.origin}/cms/api/providers/${provider}?shop=${encodeURIComponent(shop)}&code=dummy-token`;
    return NextResponse.redirect(redirect);
  }

  const dir = path.join(resolveDataRoot(), shop);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, `${provider}.json`),
    JSON.stringify({ token: code }, null, 2),
    "utf8"
  );

  return NextResponse.redirect(`/cms/wizard?connected=${provider}`);
}
