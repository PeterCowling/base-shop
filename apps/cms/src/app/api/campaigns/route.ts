import { NextResponse, type NextRequest } from "next/server";
import { sendCampaignEmail } from "@acme/email";

export async function POST(req: NextRequest) {
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
