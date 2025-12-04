import { NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import {
  evaluateProdGate,
  getLaunchGate,
  type LaunchGateEntry,
} from "@/lib/server/launchGate";
import { validateShopName } from "@platform-core/shops";

type MissingGateReason = "stage-tests" | "qa-ack";

interface GateResponse {
  gate: LaunchGateEntry;
  prodAllowed: boolean;
  missing: MissingGateReason[];
  stage: {
    status: LaunchGateEntry["stageTestsStatus"] | "not-run";
    at?: string;
    error?: string | null;
    version?: string;
    smokeDisabled?: boolean;
  };
}

export async function GET(req: Request) {
  try {
    await ensureAuthorized();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const shopId = url.searchParams.get("shopId");
  if (!shopId) {
    return NextResponse.json({ error: "Missing shop id" }, { status: 400 });
  }

  try {
    const safeId = validateShopName(shopId);
    const gate = await getLaunchGate(safeId);
    const evaluation = evaluateProdGate(gate);
    const stageStatus = gate.stageTestsStatus ?? "not-run";

    const body: GateResponse = {
      gate,
      prodAllowed: evaluation.allowed,
      missing: evaluation.missing,
      stage: {
        status: stageStatus,
        at: gate.stageTestsAt,
        error: gate.stageTestsError,
        version: gate.stageTestsVersion,
        smokeDisabled: gate.stageSmokeDisabled,
      },
    };

    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
