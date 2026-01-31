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
import { isRecord } from "@/lib/json";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const username =
      isRecord(body) && typeof body.username === "string" ? body.username : "";
    const passcode =
      isRecord(body) && typeof body.passcode === "string" ? body.passcode : "";

    // Validate input
    if (!username.trim() || !passcode.trim()) {
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
