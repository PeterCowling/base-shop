import "@acme/lib/initZod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publishPost } from "@cms/actions/blog.server";

const schema = z.object({
  shopId: z.string(),
  id: z.string(),
  publishedAt: z.string().optional(),
});

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { shopId, id, publishedAt } = parsed.data;
  const form = new FormData();
  if (publishedAt) form.set("publishedAt", publishedAt);
  const result = await publishPost(shopId, id, undefined, form);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
