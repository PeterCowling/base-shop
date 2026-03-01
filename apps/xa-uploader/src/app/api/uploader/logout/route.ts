import { NextResponse } from "next/server";

import { isUploaderIpAllowedByHeaders, uploaderAccessDeniedJsonResponse } from "../../../../lib/accessControl";
import { clearUploaderCookie } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isUploaderIpAllowedByHeaders(request.headers)) {
    return uploaderAccessDeniedJsonResponse();
  }
  const response = NextResponse.json({ ok: true });
  clearUploaderCookie(response);
  return response;
}
