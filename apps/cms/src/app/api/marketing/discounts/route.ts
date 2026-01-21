import { type NextRequest, NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";
import { promises as fs } from "fs";
import path from "path";

import { coreEnv as env } from "@acme/config/env/core";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";
import { validateShopName } from "@acme/platform-core/shops";
import type { Coupon } from "@acme/types";

import { writeJsonFile } from "@/lib/server/jsonIO";

interface Discount extends Coupon {
  active?: boolean;
}

function getShop(req: NextRequest): string {
  const { searchParams } = new URL(req.url);
  const fromQuery = searchParams.get("shop");
  if (fromQuery) return fromQuery;
  return (
    (env.NEXT_PUBLIC_DEFAULT_SHOP as string | undefined) ?? "bcd"
  );
}

function filePath(shop: string): string {
  const safe = validateShopName(shop);
  return path.join(resolveDataRoot(), safe, "discounts.json");
}

async function readDiscounts(shop: string): Promise<Discount[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-002: Path is derived from validateShopName() and resolveDataRoot(), preventing traversal and user-controlled injection.
    const buf = await fs.readFile(filePath(shop), "utf8");
    const parsed = JSON.parse(buf) as Discount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDiscounts(shop: string, discounts: Discount[]): Promise<void> {
  const fp = filePath(shop);
  await writeJsonFile(fp, discounts);
}

async function requireAdmin() {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    return null;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  const shop = getShop(req);
  const [discounts, events] = await Promise.all([
    readDiscounts(shop),
    listEvents(),
  ]);
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "discount_redeemed" && typeof e.code === "string") {
      const code = e.code;
      counts[code] = (counts[code] || 0) + 1;
    }
  }
  return NextResponse.json(
    discounts.map((d) => ({ ...d, redemptions: counts[d.code] || 0 }))
  );
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const shop = getShop(req);
  try {
    const { code, description, discountPercent } = (await req.json()) as Discount;
    if (!code || typeof discountPercent !== "number") {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }
    const discounts = await readDiscounts(shop);
    const idx = discounts.findIndex(
      (d) => d.code.toLowerCase() === code.toLowerCase()
    );
    const entry: Discount = { code, description, discountPercent, active: true };
    if (idx >= 0) discounts[idx] = entry;
    else discounts.push(entry);
    await writeDiscounts(shop, discounts);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const shop = getShop(req);
  try {
    const { code, ...rest } = (await req.json()) as Partial<Discount> & {
      code: string;
    };
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const discounts = await readDiscounts(shop);
    const idx = discounts.findIndex(
      (d) => d.code.toLowerCase() === code.toLowerCase()
    );
    if (idx < 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    discounts[idx] = { ...discounts[idx], ...rest };
    await writeDiscounts(shop, discounts);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const shop = getShop(req);
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const discounts = await readDiscounts(shop);
    const filtered = discounts.filter(
      (d) => d.code.toLowerCase() !== code.toLowerCase()
    );
    await writeDiscounts(shop, filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
