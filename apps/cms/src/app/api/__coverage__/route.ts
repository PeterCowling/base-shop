// apps/cms/src/app/api/__coverage__/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (process.env.COVERAGE !== '1') {
    const { useTranslations: getServerTranslations } = await import(
      '@acme/i18n/useTranslations.server' // i18n-exempt -- INTL-000 module specifier [ttl=2026-03-31]
    );
    const t = await getServerTranslations('en');
    return NextResponse.json({ error: t('api.coverage.disabled') }, { status: 404 });
  }
  type CoverageGlobal = { __coverage__?: unknown };
  const cov = (globalThis as unknown as CoverageGlobal).__coverage__ ?? {};
  return NextResponse.json(cov);
}
