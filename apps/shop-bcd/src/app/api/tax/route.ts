// apps/shop-bcd/src/app/api/tax/route.ts
import { calculateTax, type TaxRequest } from '@platform-core/tax';
import type { DefaultTaxProvider } from '@platform-core/src/createShop/defaultTaxProviders';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const schema = z.object({
  provider: z.string(),
  amount: z.number(),
  to: z.object({ postalCode: z.string(), country: z.string() }),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { provider, amount, to } = parsed.data;
  const apiKey = process.env[`${provider.toUpperCase()}_KEY`];
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }
  const tax = await calculateTax(
    provider as DefaultTaxProvider,
    { amount, to } satisfies TaxRequest,
    apiKey
  );
  return NextResponse.json({ tax });
}
