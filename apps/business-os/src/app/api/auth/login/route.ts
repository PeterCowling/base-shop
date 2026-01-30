/**
 * Login API Route
 * MVP-B1: Invite-only auth system
 *
 * POST /api/auth/login
 * Body: { username: string, passcode: string }
 * Returns: { success: true, user: User } or { error: string }
 */

import { NextResponse } from "next/server";

import { getSession, validateCredentials } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, passcode } = body;

    // Validate input
    if (!username || !passcode) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Username and passcode are required" },
        { status: 400 }
      );
    }

    // Validate credentials
    const user = await validateCredentials(username, passcode);

    if (!user) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid username or passcode" },
        { status: 401 }
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set session on response
    const session = await getSession(request, response);
    session.userId = user.id;
    await session.save();

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
