/**
 * GET /api/orders
 *
 * Returns paginated list of orders (50 per page, cursor-based on createdAt desc).
 *
 * Query params:
 *   cursor     — opaque cursor from previous page (base64 of createdAt ISO string)
 *   shop       — filter by shopId (comma-separated for multi-select)
 *   provider   — filter by provider ("stripe" | "axerve")
 *   status     — filter by status ("pending" | "completed" | "failed" | "resolved")
 *   from       — ISO date string (createdAt >=)
 *   to         — ISO date string (createdAt <=)
 *   q          — text search against customerEmail or providerOrderId
 *   unmask     — "1" to return unmasked customerEmail (admin-only, guarded by session)
 *
 * Response (200 OK):
 *   { orders: Order[], nextCursor: string | null }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../lib/auth/pmLog";
import { hasPmSession } from "../../../lib/auth/session";
import { maskEmail } from "../../../lib/orders/maskEmail";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

function decodeCursor(cursor: string): Date | null {
  try {
    const iso = Buffer.from(cursor, "base64url").toString("utf8");
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString("base64url");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 prisma returns any
function formatOrder(row: any, unmask: boolean) {
  return {
    id: row.id as string,
    shopId: row.shopId as string,
    provider: row.provider as string,
    status: row.status as string,
    amountCents: row.amountCents as number,
    currency: row.currency as string,
    customerEmail: unmask
      ? (row.customerEmail as string | null)
      : maskEmail(row.customerEmail as string | null),
    providerOrderId: row.providerOrderId as string | null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

interface OrderFilterParams {
  cursorParam: string | null;
  shopParam: string | null;
  providerParam: string | null;
  statusParam: string | null;
  fromParam: string | null;
  toParam: string | null;
  qParam: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma where type varies by schema
function buildOrdersWhereClause(params: OrderFilterParams): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma where type varies by schema
  const where: any = {};

  if (params.shopParam) {
    const shops = params.shopParam.split(",").filter(Boolean);
    if (shops.length === 1) {
      where.shopId = shops[0];
    } else if (shops.length > 1) {
      where.shopId = { in: shops };
    }
  }

  if (params.providerParam) {
    where.provider = params.providerParam;
  }

  if (params.statusParam) {
    where.status = params.statusParam;
  }

  if (params.fromParam || params.toParam) {
    where.createdAt = {};
    if (params.fromParam) {
      const from = new Date(params.fromParam);
      if (!isNaN(from.getTime())) {
        where.createdAt.gte = from;
      }
    }
    if (params.toParam) {
      const to = new Date(params.toParam);
      if (!isNaN(to.getTime())) {
        where.createdAt.lte = to;
      }
    }
  }

  if (params.qParam) {
    where.OR = [
      { customerEmail: { contains: params.qParam, mode: "insensitive" } },
      { providerOrderId: { contains: params.qParam, mode: "insensitive" } },
    ];
  }

  // Cursor pagination on createdAt DESC
  if (params.cursorParam) {
    const cursorDate = decodeCursor(params.cursorParam);
    if (cursorDate) {
      if (!where.createdAt) where.createdAt = {};
      where.createdAt.lt = cursorDate;
    }
  }

  return where;
}

export async function GET(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursorParam = url.searchParams.get("cursor");
  const shopParam = url.searchParams.get("shop");
  const providerParam = url.searchParams.get("provider");
  const statusParam = url.searchParams.get("status");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const qParam = url.searchParams.get("q");
  const unmask = url.searchParams.get("unmask") === "1";

  const where = buildOrdersWhereClause({
    cursorParam,
    shopParam,
    providerParam,
    statusParam,
    fromParam,
    toParam,
    qParam,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
  const prismaAny = prisma as any;

  try {
    const rows = await prismaAny.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        shopId: true,
        provider: true,
        status: true,
        amountCents: true,
        currency: true,
        customerEmail: true,
        providerOrderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNextPage = rows.length > PAGE_SIZE;
    const pageRows = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor =
      hasNextPage && pageRows.length > 0
        ? encodeCursor(pageRows[pageRows.length - 1].createdAt)
        : null;

    pmLog("info", "orders_list", {
      count: pageRows.length,
      hasNextPage,
      filters: { shop: shopParam, provider: providerParam, status: statusParam },
    });

    return NextResponse.json({
      orders: pageRows.map((row: unknown) => formatOrder(row, unmask)),
      nextCursor,
    });
  } catch (err) {
    pmLog("error", "orders_list_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
