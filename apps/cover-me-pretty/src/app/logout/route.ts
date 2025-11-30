// apps/cover-me-pretty/src/app/logout/route.ts
import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@auth";

export async function GET(_req: Request) {
  await destroyCustomerSession();
  return new NextResponse(null, {
    status: 307,
    headers: {
      location: "/",
    },
  });
}
