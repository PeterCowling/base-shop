
/**
 * Logout API Route
 * MVP-B1: Invite-only auth system
 *
 * POST /api/auth/logout
 * Destroys the session and clears the session cookie
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ success: true });
    void request;

    response.cookies.delete("current_user_id");
    response.cookies.delete("business_os_session");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
