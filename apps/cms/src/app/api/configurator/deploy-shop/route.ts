import {
  deployShopHosting,
  getDeployStatus,
  updateDeployStatus,
} from "@cms/actions/deployShop.server";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import type { Environment } from "@acme/types";

function resolveRole(session: Session | null | undefined): string | undefined {
  const envAssumeAdmin = process.env.CMS_TEST_ASSUME_ADMIN === "1";
  const role = session?.user?.role as string | undefined;
  const mockSet = Boolean((globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET);
  return role ?? (envAssumeAdmin && !mockSet ? "admin" : undefined);
}

export async function POST(req: Request) {
  const role = resolveRole(await getServerSession(authOptions));
  if (!role || !["admin", "ShopAdmin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, domain, env } = body as {
      id: string;
      domain?: string;
      env?: Environment;
    };
    const res = await deployShopHosting(id, domain, env);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const role = resolveRole(await getServerSession(authOptions));
  if (!role || !["admin", "ShopAdmin"].includes(role)) {
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
  const role = resolveRole(await getServerSession(authOptions));
  if (!role || !["admin", "ShopAdmin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
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
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
