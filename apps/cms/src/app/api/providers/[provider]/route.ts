import "@acme/zod-utils/initZod";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";
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

  const { shop, code } = parsed.data;

  if (!code) {
    const redirectParams = new URLSearchParams({ shop, code: "dummy-token" });
    const redirect = `${url.origin}/cms/api/providers/${provider}?${redirectParams.toString()}`;
    return NextResponse.redirect(redirect);
  }

  const dir = path.join(resolveDataRoot(), shop);
  await writeJsonFile(path.join(dir, `${provider}.json`), { token: code });

  return NextResponse.redirect(`/cms/configurator?connected=${provider}`);
}
