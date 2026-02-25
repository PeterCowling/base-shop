import { NextResponse } from "next/server";

import { readAccountSession } from "../../../../lib/accountAuth";
import { getAccountUserById } from "../../../../lib/accountStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await readAccountSession(request);
  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const { user, storeMode } = await getAccountUserById(session.userId);
  if (!user) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    email: user.email,
    storeMode,
  });
}
