// apps/cms/src/app/api/__coverage__/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (process.env.COVERAGE !== '1') {
    return NextResponse.json({ error: 'coverage disabled' }, { status: 404 });
  }
  const cov = (globalThis as any).__coverage__ || {};
  return NextResponse.json(cov);
}

