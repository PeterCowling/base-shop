import { NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { verifyShopAfterDeploy } from "@cms/actions/verifyShopAfterDeploy.server";

import type { Environment } from "@acme/types";

import { recordStageTests } from "@/lib/server/launchGate";

export async function POST(req: Request) {
  try {
    await ensureAuthorized();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { shopId, env } = body as { shopId?: string; env?: Environment };
    if (!shopId) {
      return NextResponse.json({ error: "Missing shop id" }, { status: 400 });
    }
    const targetEnv: Environment = env ?? "stage";
    const timestamp = new Date().toISOString();
    const verification = await verifyShopAfterDeploy(shopId, targetEnv);
    if (targetEnv === "stage") {
      try {
        await recordStageTests(shopId, {
          status: verification.status,
          error: verification.error,
          at: timestamp,
          version: timestamp,
          smokeEnabled: process.env.SHOP_SMOKE_ENABLED === "1",
        });
      } catch {
        /* best-effort gate persistence */
      }
    }
    return NextResponse.json(verification);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
