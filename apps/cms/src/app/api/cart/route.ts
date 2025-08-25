import { NextResponse } from "next/server";

// Use the Node.js runtime to avoid long edge compilation in development
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function empty(method: string) {
  console.log(`[api/cart] ${method} called`);
  return NextResponse.json({ ok: true, cart: {} });
}

export async function GET() {
  return empty("GET");
}

export async function POST() {
  return empty("POST");
}

export async function PUT() {
  return empty("PUT");
}

export async function PATCH() {
  return empty("PATCH");
}

export async function DELETE() {
  return empty("DELETE");
}
