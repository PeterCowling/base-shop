import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

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
        // i18n-exempt -- MVP-G1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid locale. Must be 'en' or 'it'.", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { locale } = parsed.data;

    const response = NextResponse.json(
      {
        success: true,
        locale,
        // i18n-exempt -- MVP-G1 Phase 0 API success message [ttl=2026-03-31]
        message: `Locale set to ${locale}`,
      },
      { status: 200 }
    );

    response.cookies.set("business_os_locale", locale, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- MVP-G1 Phase 0 API error message [ttl=2026-03-31]
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
    void request;

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("business_os_locale")?.value;
    const locale = localeCookie === "it" ? "it" : "en";

    return NextResponse.json({ locale }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- MVP-G1 Phase 0 API error message [ttl=2026-03-31]
      { error: "Failed to get locale", details: String(error) },
      { status: 500 }
    );
  }
}
