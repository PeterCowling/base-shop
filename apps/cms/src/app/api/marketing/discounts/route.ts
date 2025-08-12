import { NextRequest, NextResponse } from "next/server";
import { discountSchema, type Discount } from "@acme/types";
import {
  readDiscountRepo,
  writeDiscountRepo,
} from "@platform-core/repositories/discounts.server";
import { readAggregates } from "@platform-core/repositories/analytics.server";

function getShop(req: NextRequest): string {
  const { searchParams } = new URL(req.url);
  return searchParams.get("shop") ?? "abc";
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = getShop(req);
  const [discounts, aggregates] = await Promise.all([
    readDiscountRepo(shop),
    readAggregates(shop),
  ]);
  const counts = aggregates.discount || {};
  const withCounts = discounts.map((d) => ({
    ...d,
    redemptions: counts[d.code] || 0,
  }));
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const shop = getShop(req);
  const body = await req.json().catch(() => ({}));
  const parsed = discountSchema.parse(body as Discount);
  const discounts = await readDiscountRepo(shop);
  if (discounts.some((d) => d.code.toLowerCase() === parsed.code.toLowerCase())) {
    return NextResponse.json({ error: "Code exists" }, { status: 400 });
  }
  discounts.push(parsed);
  await writeDiscountRepo(shop, discounts);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const shop = getShop(req);
  const body = (await req.json().catch(() => ({}))) as Partial<Discount> & {
    code?: string;
  };
  const code = body.code;
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const discounts = await readDiscountRepo(shop);
  const idx = discounts.findIndex(
    (d) => d.code.toLowerCase() === code.toLowerCase()
  );
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  discounts[idx] = { ...discounts[idx], ...body } as Discount;
  await writeDiscountRepo(shop, discounts);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const shop = getShop(req);
  const { code } = (await req.json().catch(() => ({}))) as {
    code?: string;
  };
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const discounts = await readDiscountRepo(shop);
  const next = discounts.filter(
    (d) => d.code.toLowerCase() !== code.toLowerCase()
  );
  await writeDiscountRepo(shop, next);
  return NextResponse.json({ ok: true });
}
