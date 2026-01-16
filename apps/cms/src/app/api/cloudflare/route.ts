import { provisionDomain } from "@cms/actions/cloudflare.server";
import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const body = await req.json();
    const { id, domain } = body as { id: string; domain: string };
    const res = await provisionDomain(id, domain);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
