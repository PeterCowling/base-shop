import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";

// Phase 0: Node runtime required for session operations
export const runtime = "nodejs";

const SetLocaleSchema = z.object({
  locale: z.enum(["en", "it"]),
});

/**
 * POST /api/user/locale
 * Set user's locale preference in session
 *
 * MVP-G1: User locale preference storage
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = SetLocaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid locale. Must be 'en' or 'it'.", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { locale } = parsed.data;

    // Get session
    const response = NextResponse.next();
    const session = await getSession(request, response);

    // Update locale in session
    session.locale = locale;
    await session.save();

    return NextResponse.json(
      {
        success: true,
        locale,
        // i18n-exempt -- BOS-04 Phase 0 API success message [ttl=2026-03-31]
        message: `Locale set to ${locale}`,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Failed to set locale", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/locale
 * Get user's current locale preference from session
 */
export async function GET(request: Request) {
  try {
    const response = NextResponse.next();
    const session = await getSession(request, response);

    const locale = session.locale ?? "en"; // Default to English

    return NextResponse.json(
      {
        locale,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Failed to get locale", details: String(error) },
      { status: 500 }
    );
  }
}
