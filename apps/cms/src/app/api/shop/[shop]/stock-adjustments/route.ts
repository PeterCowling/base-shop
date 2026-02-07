import { type NextRequest,NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import {
  applyStockAdjustment,
  listStockAdjustments,
} from "@acme/platform-core/repositories/stockAdjustments.server";
import { checkShopExists } from "@acme/platform-core/shops";

export const runtime = "nodejs";

function getRole(session: Session | null): Role | null {
  const role = session?.user?.role;
  if (typeof role !== "string") return null;
  return role as Role;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shop } = await context.params;
  if (!(await checkShopExists(shop))) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(250, Math.floor(limit))) : 50;

  try {
    const events = await listStockAdjustments(shop, { limit: safeLimit });
    return NextResponse.json({ events }, { status: 200 });
  } catch (err) {
    console.error("Stock adjustments GET failed", err); // i18n-exempt -- non-UX log
    return NextResponse.json({ error: "Failed to list stock adjustments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shop } = await context.params;
  if (!(await checkShopExists(shop))) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const actor = {
    customerId:
      typeof (session?.user as Record<string, unknown> | undefined)?.id === "string"
        ? ((session?.user as Record<string, unknown>).id as string)
        : undefined,
    role,
  };

  try {
    const body = await req.json().catch(() => null);
    const result = await applyStockAdjustment(shop, body, { actor });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (err) {
    console.error("Stock adjustments POST failed", err); // i18n-exempt -- non-UX log
    return NextResponse.json({ error: "Failed to apply stock adjustment" }, { status: 500 });
  }
}
