// apps/shop-bcd/src/app/api/shipping-rate/route.ts
import { fetchShippingRate, type ShippingRateRequest } from '@platform-core/shipping';
import type { DefaultShippingProvider } from '@platform-core/src/createShop/defaultShippingProviders';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const schema = z.object({
  provider: z.string(),
  from: z.object({ postalCode: z.string(), country: z.string() }),
  to: z.object({ postalCode: z.string(), country: z.string() }),
  weight: z.number(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { provider, from, to, weight } = parsed.data;
  const apiKey = process.env[`${provider.toUpperCase()}_KEY`];
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }
  const rate = await fetchShippingRate(
    provider as DefaultShippingProvider,
    { from, to, weight } satisfies ShippingRateRequest,
    apiKey
  );
  return NextResponse.json({ rate });
}
