import { type NextRequest,NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { checkShopExists } from "@acme/platform-core";
import { readVariants, writeVariants } from "@acme/platform-core/repositories/variants.server";
import { variantPricingSchema } from "@acme/platform-core/types/variants";

export const runtime = "nodejs";

function getRole(session: Session | null): Role | null {
  const role = session?.user?.role;
  if (typeof role !== "string") return null;
  return role as Role;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_catalog")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shop } = await context.params;
  if (!(await checkShopExists(shop))) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  try {
    const variants = await readVariants(shop);
    return NextResponse.json({ variants }, { status: 200 });
  } catch (err) {
    console.error("Variants GET failed", err); // i18n-exempt -- non-UX log
    return NextResponse.json({ error: "Failed to read variants" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_catalog")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shop } = await context.params;
  if (!(await checkShopExists(shop))) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => null);
    const arr = Array.isArray(body?.variants) ? body.variants : body;
    const parsed = Array.isArray(arr)
      ? arr.map((item) => variantPricingSchema.parse(item))
      : null;
    if (!parsed) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await writeVariants(shop, parsed);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Variants POST failed", err); // i18n-exempt -- non-UX log
    return NextResponse.json({ error: "Failed to save variants" }, { status: 500 });
  }
}
