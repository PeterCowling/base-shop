import { NextResponse } from "next/server";
import { provisionDomain } from "@cms/actions/cloudflare.server";
import { ensureRole } from "@cms/actions/common/auth";

export async function POST(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const body = await req.json();
    const { id, domain } = body as { id: string; domain: string };
    const res = await provisionDomain(id, domain);
    return NextResponse.json(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message === "Forbidden" || message === "Unauthorized" ? 403 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
