import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const dm = await draftMode();
  dm.enable();
  const url = new URL(request.url);
  url.pathname += "/view";
  return NextResponse.redirect(url);
}
