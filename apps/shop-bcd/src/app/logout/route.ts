// apps/shop-bcd/src/app/logout/route.ts
import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@auth";

export async function GET(req: Request) {
  await destroyCustomerSession();
  return NextResponse.redirect(new URL("/", req.url));
}
