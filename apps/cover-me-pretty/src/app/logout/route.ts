// apps/cover-me-pretty/src/app/logout/route.ts
import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@auth";
import { authEnv } from "@acme/config/env/auth";

export async function GET(_req: Request) {
  if (authEnv.AUTH_PROVIDER === "oauth") {
    return NextResponse.redirect(new URL("/auth/logout", _req.url));
  }
  await destroyCustomerSession();
  return new NextResponse(null, {
    status: 307,
    headers: {
      location: "/",
    },
  });
}
