import "@acme/lib/initZod";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { resolveDataRoot } from "@platform-core/dataRoot";

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

  const { shop, code } = parsed.data;

  if (!code) {
    const redirectParams = new URLSearchParams({ shop, code: "dummy-token" });
    const redirect = `${url.origin}/cms/api/providers/${provider}?${redirectParams.toString()}`;
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
