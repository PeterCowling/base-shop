import { NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";
import {
  deployShopHosting,
  getDeployStatus,
  updateDeployStatus,
} from "@cms/actions/deployShop.server";

import type { Environment } from "@acme/types";

export async function POST(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const body = await req.json();
    const { id, domain, env } = body as {
      id: string;
      domain?: string;
      env?: Environment;
    };
    const res = await deployShopHosting(id, domain, env);
    return NextResponse.json(res);
  } catch (err) {
    const message = (err as Error).message;
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const status = await getDeployStatus(id);
  return NextResponse.json(status);
}

export async function PUT(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const body = await req.json();
    const { id, ...data } = body as {
      id: string;
      domain?: string;
      domainStatus?: string;
      certificateStatus?: string;
      instructions?: string;
    } & Record<string, unknown>;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await updateDeployStatus(id, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = (err as Error).message;
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
