/**
 * Login API Route
 * MVP-B1: Invite-only auth system
 *
 * POST /api/auth/login
 * Body: { username: string, passcode: string }
 * Returns: { success: true, user: User } or { error: string }
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { USERS } from "@/lib/current-user";

export const runtime = "edge";

const LoginSchema = z.object({
  username: z.string().min(1),
  passcode: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const authEnabled = process.env.BUSINESS_OS_AUTH_ENABLED === "true";
    if (authEnabled) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Auth is not supported in Edge runtime yet." },
        { status: 501 }
      );
    }

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Username and passcode are required" },
        { status: 400 }
      );
    }

    const { username, passcode } = parsed.data;

    const user = USERS[username];
    if (!user) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid username or passcode" },
        { status: 401 }
      );
    }

    // Phase 0 (no auth): simple dev passcodes (mirrors /login helper copy)
    const expectedPasscode = `${username}123`;
    if (passcode !== expectedPasscode) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid username or passcode" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("current_user_id", user.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

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
