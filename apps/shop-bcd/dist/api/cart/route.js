import { NextResponse } from "next/server";
export const runtime = "edge";
// This simple handler echoes back the posted body and status 200.
// Stripe / KV integration will extend this in Sprint 5.
export async function POST(req) {
    const body = await req.json();
    // todo: validate body schema
    return NextResponse.json({ ok: true, received: body });
}
export async function PATCH(req) {
    const body = await req.json();
    // todo: update existing cart
    return NextResponse.json({ ok: true, patched: body });
}
