import { NextResponse } from "next/server";

import { sendBookingEmail } from "@acme/mcp-server/booking-email";

import { requireStaffAuth } from "../_shared/staff-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffAuth(request);
    if ("response" in auth) {
      return auth.response;
    }

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
