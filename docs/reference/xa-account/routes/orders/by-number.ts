import { NextResponse } from "next/server";

import { readAccountSession } from "../../../../../lib/accountAuth";
import {
  accountOrderTotal,
  findOrderForAccountUser,
} from "../../../../../lib/accountStore";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await readAccountSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await params;
  const normalizedOrderNumber = decodeURIComponent(orderNumber).trim();
  if (!normalizedOrderNumber) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { order, storeMode } = await findOrderForAccountUser(
    session.userId,
    normalizedOrderNumber,
  );
  if (!order) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    storeMode,
    order: {
      ...order,
      total: accountOrderTotal(order),
    },
  });
}
