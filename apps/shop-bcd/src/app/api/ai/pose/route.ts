import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@acme/lib/tryon";
import { kvGet, kvPut } from "@acme/lib/tryon/kv";
import { AwsClient } from 'aws4fetch';

export const runtime = "edge";

const Body = z.object({ imageUrl: z.string().url(), idempotencyKey: z.string().uuid() });

const PREVIEW_LIMIT = 20;
const buckets = new Map<string, { count: number; exp: number }>();
function todayKey(id: string) {
  const d = new Date();
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  return `${id}:${day}`;
}
function identity(req: Request): string {
  const cookies = req.headers.get('cookie') || '';
  const m = /(?:^|;\s*)tryon\.uid=([^;]+)/.exec(cookies);
  if (m) return decodeURIComponent(m[1]);
  const xf = req.headers.get('x-forwarded-for') || '';
  if (xf) return xf.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || 'anon';
}
async function checkQuota(req: Request): Promise<string | null> {
  const id = identity(req);
  const key = todayKey(id);
  const now = Date.now();
  try {
    const v = await kvGet(`quota:preview:${key}`);
    const n = v ? parseInt(v, 10) : 0;
    if (n >= PREVIEW_LIMIT) return id;
    const end = new Date(); end.setUTCHours(23,59,59,999);
    await kvPut(`quota:preview:${key}`, String(n + 1), Math.max(1, Math.floor((end.getTime() - now) / 1000)));
    return null;
  } catch {}
  const rec = buckets.get(key);
  if (rec && rec.exp > now && rec.count >= PREVIEW_LIMIT) return id;
  const exp = new Date(); exp.setUTCHours(23,59,59,999);
  if (!rec || rec.exp <= now) buckets.set(key, { count: 1, exp: exp.getTime() });
  else { rec.count += 1; buckets.set(key, rec); }
  return null;
}

type AwsSignOptions = RequestInit & {
  signQuery?: boolean;
  expires?: number;
};

async function signGetForProvider(imageUrl: string): Promise<string> {
  try {
    const u = new URL(imageUrl);
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_TRYON;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return imageUrl;
    const key = u.pathname.replace(/^\//, '');
    if (!key.startsWith('tryon/')) return imageUrl;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' });
    const signed: { url?: string } | string = await client.sign(
      endpoint,
      { method: "GET", signQuery: true, expires: 300 } satisfies AwsSignOptions
    );
    if (typeof signed === "string") return signed;
    return signed.url ?? String(signed);
  } catch { return imageUrl; }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const t0 = Date.now();
    const data = await req.json();
    const parsed = Body.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
    const over = await checkQuota(req);
    if (over) return NextResponse.json({ error: { code: 'QUOTA_EXCEEDED' } }, { status: 429 });
    const { imageUrl } = parsed.data;
    try {
      const cached = await kvGet(`idem:${parsed.data.idempotencyKey}:pose`);
      if (cached) return NextResponse.json({ poseUrl: cached, metrics: { preprocessMs: 0 } });
    } catch {}
    const provider = getProvider();
    if (!provider.pose) return NextResponse.json({});
    const signedUrl = await signGetForProvider(imageUrl);
    const resp = await provider.pose.run(signedUrl);
    const ms = Date.now() - t0;
    try {
      const host = new URL(imageUrl).host;
      console.log("tryon.pose", { jobId: parsed.data.idempotencyKey, host, ms, ok: !resp.error });
    } catch {}
    if (resp.error) return NextResponse.json({ error: resp.error }, { status: 502 });
    const url = resp.result?.url;
    try { if (url) await kvPut(`idem:${parsed.data.idempotencyKey}:pose`, url, 86400); } catch {}
    return NextResponse.json({ poseUrl: url, metrics: { preprocessMs: resp.metrics?.preprocessMs ?? ms } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected";
    return NextResponse.json({ error: { code: "UNKNOWN", message } }, { status: 500 });
  }
}
