import { NextResponse } from "next/server";

import { sendGuestEmailActivity } from "@acme/mcp-server/guest-email-activity";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await sendGuestEmailActivity(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
