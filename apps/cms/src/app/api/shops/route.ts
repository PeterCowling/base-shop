import { NextResponse } from "next/server";
import { listShops } from "../cms/listShops";

export async function GET() {
  const shops = await listShops();
  return NextResponse.json(shops);
}
