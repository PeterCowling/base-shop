import { NextResponse } from "next/server";

import { sendBookingEmail } from "@acme/mcp-server/booking-email";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await sendBookingEmail(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
