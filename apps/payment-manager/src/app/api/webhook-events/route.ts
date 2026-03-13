/**
 * GET /api/webhook-events
 *
 * Returns paginated list of Stripe webhook events (50 per page, cursor-based on updatedAt desc).
 *
 * Query params:
 *   cursor   — opaque cursor from previous page (base64url of updatedAt ISO string)
 *   shop     — filter by shop (string)
 *   type     — filter by event type (e.g. "checkout.session.completed")
 *   status   — filter by status ("processed" | "failed")
 *   from     — ISO date string (createdAt >=)
 *   to       — ISO date string (createdAt <=)
 *
 * Response (200 OK):
 *   { events: WebhookEvent[], nextCursor: string | null }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../lib/auth/pmLog";
import { hasPmSession } from "../../../lib/auth/session";

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

interface WebhookEventFilterParams {
  cursorParam: string | null;
  shopParam: string | null;
  typeParam: string | null;
  statusParam: string | null;
  fromParam: string | null;
  toParam: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma where type varies
function buildWebhookEventsWhereClause(params: WebhookEventFilterParams): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma where type varies
  const where: any = {};

  if (params.shopParam) {
    where.shop = params.shopParam;
  }

  if (params.typeParam) {
    where.type = { contains: params.typeParam, mode: "insensitive" };
  }

  if (params.statusParam) {
    where.status = params.statusParam;
  }

  if (params.fromParam || params.toParam) {
    where.createdAt = {};
    if (params.fromParam) {
      const from = new Date(params.fromParam);
      if (!isNaN(from.getTime())) where.createdAt.gte = from;
    }
    if (params.toParam) {
      const to = new Date(params.toParam);
      if (!isNaN(to.getTime())) where.createdAt.lte = to;
    }
  }

  if (params.cursorParam) {
    const cursorDate = decodeCursor(params.cursorParam);
    if (cursorDate) {
      if (!where.updatedAt) where.updatedAt = {};
      where.updatedAt.lt = cursorDate;
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
  const typeParam = url.searchParams.get("type");
  const statusParam = url.searchParams.get("status");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const where = buildWebhookEventsWhereClause({
    cursorParam, shopParam, typeParam, statusParam, fromParam, toParam,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
  const prismaAny = prisma as any;

  try {
    const rows = await prismaAny.stripeWebhookEvent.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        shop: true,
        type: true,
        status: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNextPage = rows.length > PAGE_SIZE;
    const pageRows = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor =
      hasNextPage && pageRows.length > 0
        ? encodeCursor(pageRows[pageRows.length - 1].updatedAt)
        : null;

    pmLog("info", "webhook_events_list", {
      count: pageRows.length,
      hasNextPage,
      filters: { shop: shopParam, type: typeParam, status: statusParam },
    });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
      events: pageRows.map((row: any) => ({
        id: row.id as string,
        shop: row.shop as string,
        type: row.type as string,
        status: row.status as string,
        lastError: row.lastError as string | null,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
      })),
      nextCursor,
    });
  } catch (err) {
    pmLog("error", "webhook_events_list_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
