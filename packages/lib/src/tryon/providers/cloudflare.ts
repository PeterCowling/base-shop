import type { TryOnProvider } from "./types";
import type { ProviderResponse } from "@acme/types/tryon";
import { createBreaker } from "./circuitBreaker";
import { BUDGET } from "../index";
import { t } from "../i18n";

const SEGMENT_MODEL = "@cf/unum/u2net"; // background/foreground segmentation
const DEPTH_MODEL = "@cf/openmmlab/midas"; // depth estimation

type CfRequestInit = RequestInit & {
  cf?: {
    cacheTtl?: number;
    cacheEverything?: boolean;
  };
};

function toDataUrl(contentType: string, buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  const b64 = btoa(binary);
  return `data:${contentType};base64,${b64}`;
}

function allowedOrigins(): string[] {
  const origins: string[] = [];
  try {
    const r2 = process.env.R2_PUBLIC_BASE_URL;
    if (r2) origins.push(new URL(r2).origin);
  } catch {}
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (acct) origins.push(`https://${acct}.r2.cloudflarestorage.com`);
  return origins;
}

function assertAllowed(url: string) {
  const o = new URL(url).origin;
  const ok = allowedOrigins().some((allowed) => allowed === o);
  if (!ok) throw new Error(t('tryon.providers.cloudflare.originNotAllowed'));
}

async function fetchImageAsBlob(url: string): Promise<Blob> {
  assertAllowed(url);
  const init: CfRequestInit = { cf: { cacheTtl: 60, cacheEverything: false } };
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(t('tryon.providers.cloudflare.fetchFailed', { status: res.status }));
  return await res.blob();
}

export async function runWorkersAi(
  model: string,
  image: Blob,
): Promise<{ contentType: string; body: ArrayBuffer } | { error: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID;

  if (!accountId) return { error: t('tryon.providers.cloudflare.accountIdMissing') };

  const useGateway = !!gatewayId;
  const url = useGateway
    ? `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai/run/${encodeURIComponent(model)}`
    : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`;

  const form = new FormData();
  form.append("image", image, "image");

  const headers: Record<string, string> = {};
  if (!useGateway) {
    if (!apiToken) return { error: t('tryon.providers.cloudflare.apiTokenMissing') };
    headers["Authorization"] = `Bearer ${apiToken}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BUDGET.preprocessMs);
  try {
    const requestInit: RequestInit = { method: "POST", headers, body: form, signal: ctrl.signal };
    const resp = await fetch(url, requestInit);
    if (!resp.ok) return { error: t('tryon.providers.cloudflare.upstreamError', { status: resp.status }) };
    const ct = resp.headers.get("content-type") || "application/octet-stream";
    if (ct.startsWith("application/json")) {
      // Fallback to JSON payloads with base64 fields if any
      const json = await resp.json().catch(() => ({}));
      const base64 = json?.result?.image || json?.image || json?.result?.output?.[0];
      if (!base64) return { error: t('tryon.providers.cloudflare.noImageInJson') };
      // Return as PNG by default
      const body = Uint8Array.from(atob(String(base64)), (c) => c.charCodeAt(0)).buffer;
      return { contentType: "image/png", body };
    }
    const ab = await resp.arrayBuffer();
    return { contentType: ct, body: ab };
  } finally {
    clearTimeout(timer);
  }
}

export function formatWorkersAiOutput(
  out: { contentType?: string; body: ArrayBuffer },
  startedAt: number,
  now: number = Date.now(),
): ProviderResponse {
  const url = toDataUrl(out.contentType || "image/png", out.body);
  return { result: { url, width: 0, height: 0 }, metrics: { preprocessMs: now - startedAt } };
}

export function createCloudflareProvider(): TryOnProvider {
  const breakerSeg = createBreaker({ timeoutMs: BUDGET.preprocessMs, failureThreshold: 3, coolOffMs: 5000 });
  const breakerDepth = createBreaker({ timeoutMs: BUDGET.preprocessMs, failureThreshold: 3, coolOffMs: 5000 });

  return {
    segmenter: {
      async run(imgUrl: string): Promise<ProviderResponse> {
        return breakerSeg.exec("segment", async () => {
          const t0 = Date.now();
          if (!process.env.CLOUDFLARE_ACCOUNT_ID) return {};
          const blob = await fetchImageAsBlob(imgUrl);
          const out = await runWorkersAi(SEGMENT_MODEL, blob);
          if ("error" in out) return { error: { code: "PROVIDER_UNAVAILABLE", details: out.error } };
          return formatWorkersAiOutput(out, t0);
        });
      },
    },
    depth: {
      async run(imgUrl: string): Promise<ProviderResponse> {
        return breakerDepth.exec("depth", async () => {
          const t0 = Date.now();
          if (!process.env.CLOUDFLARE_ACCOUNT_ID) return {};
          const blob = await fetchImageAsBlob(imgUrl);
          const out = await runWorkersAi(DEPTH_MODEL, blob);
          if ("error" in out) return { error: { code: "PROVIDER_UNAVAILABLE", details: out.error } };
          return formatWorkersAiOutput(out, t0);
        });
      },
    },
  };
}
