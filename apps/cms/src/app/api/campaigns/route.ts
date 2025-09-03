import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { to, subject, body } = (await req.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    body?: string;
  };

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const { sendCampaignEmail } = await import("@acme/email");
    await sendCampaignEmail({ to, subject, html: body });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
