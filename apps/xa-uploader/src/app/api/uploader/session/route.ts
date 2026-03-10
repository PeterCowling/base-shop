import { NextResponse } from "next/server";

import { isUploaderIpAllowedByHeaders, uploaderAccessDeniedJsonResponse } from "../../../../lib/accessControl";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isUploaderIpAllowedByHeaders(request.headers)) {
    return uploaderAccessDeniedJsonResponse();
  }
  const authenticated = await hasUploaderSession(request);
  return NextResponse.json({ ok: true, authenticated });
}
