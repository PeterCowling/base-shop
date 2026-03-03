import type { NextRequest } from "next/server";

import { handleCheckoutSessionRequest } from "@/lib/checkoutSession.server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleCheckoutSessionRequest(req);
}
