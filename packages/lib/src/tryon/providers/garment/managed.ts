import type { ProviderResponse } from "@acme/types/tryon";

import { t } from "../../i18n";
import type { TryOnGenerator, TryOnProvider } from "../types";

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}

const generator: TryOnGenerator = {
  async run(opts) {
    const url = process.env.TRYON_HEAVY_API_URL;
    if (!url) {
      return { error: { code: 'PROVIDER_UNAVAILABLE', details: t('tryon.providers.garment.heavyApiUrlMissing') } };
    }
    const idem = crypto.randomUUID();
    const res = await postJson(url, opts, { 'Idempotency-Key': idem });
    if (!res.ok) {
      return { error: { code: 'PROVIDER_UNAVAILABLE', details: t('tryon.providers.garment.upstreamError', { status: res.status }) } };
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      if (data?.url) return { result: { url: data.url, width: data.width ?? 0, height: data.height ?? 0, expiresAt: data.expiresAt } } as ProviderResponse;
    }
    return { error: { code: 'UNKNOWN', details: t('tryon.providers.garment.unexpectedResponse') } };
  },
};

export function createManagedTryOnProvider(): TryOnProvider {
  return { generator };
}

