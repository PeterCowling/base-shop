import { type NextRequest,NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";

import { sendCampaignEmail } from "@acme/email";

export async function POST(req: NextRequest) {
  try {
    await ensureAuthorized();
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { to, subject, body } = (payload ?? {}) as {
    to?: string;
    subject?: string;
    body?: string;
  };

  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    await sendCampaignEmail({ to, subject, html: body });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send campaign email", err);
    return NextResponse.json(
      { error: "Failed to send" },
      { status: 500 },
    );
  }
}
