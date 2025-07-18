import { NextResponse } from "next/server";
import { listShops } from "../../cms/listShops";

export async function GET() {
  try {
    const shops = await listShops();
    return NextResponse.json(shops);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
