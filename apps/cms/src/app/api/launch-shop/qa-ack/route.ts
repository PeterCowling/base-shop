import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureAuthorized } from "@cms/actions/common/auth";
import {
  getLaunchGate,
  recordQaAcknowledgement,
} from "@/lib/server/launchGate";
import { validateShopName } from "@acme/platform-core/shops";

async function requireCsrf(req: Request): Promise<void> {
  const header = req.headers.get("x-csrf-token");
  const cookieStore = await cookies();
  const cookie = cookieStore.get("csrf_token")?.value || null;
  if (!header || !cookie || header !== cookie) {
    throw new Error("Forbidden");
  }
}

export async function POST(req: Request) {
  try {
    await requireCsrf(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await ensureAuthorized().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      shopId?: string;
      note?: string | null;
    };
    if (!body.shopId) {
      return NextResponse.json({ error: "Missing shop id" }, { status: 400 });
    }

    const safeId = validateShopName(body.shopId);
    const gate = await getLaunchGate(safeId);
    if (!gate.stageTestsVersion) {
      return NextResponse.json(
        { error: "Missing stage verification" },
        { status: 400 },
      );
    }

    const gateWithAck = await recordQaAcknowledgement(safeId, {
      acknowledgedAt: new Date().toISOString(),
      note: body.note,
      userId: session.user?.id ?? null,
      name: session.user?.name ?? session.user?.email ?? null,
      stageVersion: gate.stageTestsVersion,
    });

    return NextResponse.json({ ok: true, gate: gateWithAck });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to record QA acknowledgement" },
      { status: 400 },
    );
  }
}
