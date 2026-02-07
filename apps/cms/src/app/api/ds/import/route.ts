import { type NextRequest, NextResponse } from "next/server";

import { parseDsPackage } from "@acme/theme";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data: unknown;
  if (typeof body.npm === "string") {
    try {
      const res = await fetch(`https://unpkg.com/${body.npm}`);
      data = await res.json();
    } catch {
      return NextResponse.json({ error: "Failed to fetch package" }, { status: 400 });
    }
  } else if (body.json) {
    data = body.json;
  } else {
    return NextResponse.json({ error: "No input provided" }, { status: 400 });
  }

  const parsed = parseDsPackage(data);
  return NextResponse.json(parsed);
}
