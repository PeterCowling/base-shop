import { NextResponse } from "next/server";

export const runtime = "edge";

function empty() {
  return NextResponse.json({ ok: true, cart: {} });
}

export async function GET() {
  return empty();
}

export async function POST() {
  return empty();
}

export async function PUT() {
  return empty();
}

export async function PATCH() {
  return empty();
}

export async function DELETE() {
  return empty();
}
