import { NextResponse, type NextRequest } from "next/server";

// Minimal stub endpoint for sending marketing campaigns from the CMS UI.
// Accepts JSON payload and returns success without performing any delivery.
export async function POST(req: NextRequest) {
  try {
    // Read payload to keep consistent with real-world shape; ignore content.
    await req.json().catch(() => ({}));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

