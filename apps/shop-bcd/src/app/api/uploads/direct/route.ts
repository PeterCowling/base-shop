import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AwsClient } from "aws4fetch";

export const runtime = "edge";

const BodySchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  idempotencyKey: z.string().uuid(),
  filename: z.string().optional(),
  // Optional client-reported dimensions (post-resize) for server-side cap enforcement
  width: z.number().int().positive().max(4096).optional(),
  height: z.number().int().positive().max(4096).optional(),
  sizeBytes: z.number().int().positive().max(10_000_000).optional(),
});

const FIVE_MIN = 60 * 5;

function extFromContentType(ct: string): string {
  switch (ct) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

async function hmac(key: CryptoKey | ArrayBuffer, data: string | Uint8Array): Promise<ArrayBuffer> {
  const raw = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const k = (key as any).byteLength !== undefined
    ? await crypto.subtle.importKey('raw', key as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    : (key as CryptoKey);
  return crypto.subtle.sign('HMAC', k, raw);
}

async function deriveSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const seed = new TextEncoder().encode(`AWS4${secret}`).buffer as ArrayBuffer;
  const kDate = await hmac(seed, date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ensureAnonId(req: NextRequest): { id: string; setCookie?: string } {
  const existing = req.cookies.get("tryon.uid")?.value;
  if (existing) return { id: existing };
  const raw = (globalThis.crypto as Crypto).randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const id = `u_${raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
  const cookie = [
    `tryon.uid=${encodeURIComponent(id)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    // 180 days
    `Max-Age=${60 * 60 * 24 * 180}`,
  ].join("; ");
  return { id, setCookie: cookie };
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Validate body
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const { contentType, idempotencyKey, filename, width, height, sizeBytes } = parsed.data;

    // Optional server-side pixel cap (6 MP) and max dimension guard (<= 1600)
    if (typeof width === 'number' && typeof height === 'number') {
      const pixels = width * height;
      if (pixels > 6_000_000) {
        return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Image too large" } }, { status: 400 });
      }
      if (Math.max(width, height) > 1600) {
        return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Max dimension exceeded" } }, { status: 400 });
      }
    }
    // If strict mode is enabled, width/height must be provided
    if ((process.env.TRYON_REQUIRE_DIMENSIONS || '').toLowerCase() === 'true') {
      if (typeof width !== 'number' || typeof height !== 'number') {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing image dimensions' } }, { status: 400 });
      }
    }

    // Enforce byte cap when provided (client sends blob.size)
    if (typeof sizeBytes === 'number' && sizeBytes > 8_000_000) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'File too large' } }, { status: 400 });
    }

    // Validate env
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_TRYON;
    const publicBase = process.env.R2_PUBLIC_BASE_URL;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !publicBase || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          error: {
            code: "UNKNOWN",
            message: "R2 configuration missing. Ensure account, bucket, keys and public base URL are set.",
          },
        },
        { status: 500 },
      );
    }

    // Compute object key
    const { id: anonId, setCookie } = ensureAnonId(req);
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const ext = extFromContentType(contentType);
    const key = `tryon/${anonId}/${yyyy}/${mm}/${dd}/${idempotencyKey}.${ext}`;

    // Pre-sign using SigV4 query params
    const s3Endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const putHeaders = new Headers();
    putHeaders.set("Content-Type", contentType);
    putHeaders.set("x-amz-meta-x-idempotency-key", idempotencyKey);
    if (filename) putHeaders.set("x-amz-meta-x-filename", filename);

    // Sign query with 5 minute expiry
    const signedReq = await client.sign(s3Endpoint, {
      method: "PUT",
      headers: putHeaders,
      signQuery: true,
      expires: FIVE_MIN,
    } as any);

    const uploadUrl = (signedReq as any).url || String(signedReq);
    const objectUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
    const expiresAt = new Date(Date.now() + FIVE_MIN * 1000).toISOString();

    // Also produce a pre-signed POST policy with content-length-range and content-type conditions
    const now2 = new Date();
    const yyyymmdd = `${now2.getUTCFullYear()}${String(now2.getUTCMonth() + 1).padStart(2, '0')}${String(now2.getUTCDate()).padStart(2, '0')}`;
    const amzDate = `${yyyymmdd}T${String(now2.getUTCHours()).padStart(2, '0')}${String(now2.getUTCMinutes()).padStart(2, '0')}${String(now2.getUTCSeconds()).padStart(2, '0')}Z`;
    const credential = `${accessKeyId}/${yyyymmdd}/auto/s3/aws4_request`;
    const policyDoc = {
      expiration: new Date(Date.now() + FIVE_MIN * 1000).toISOString(),
      conditions: [
        { bucket },
        ["starts-with", "$key", key],
        { "Content-Type": contentType },
        ["content-length-range", 1, Math.min(sizeBytes ?? 8_000_000, 8_000_000)],
        { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
        { "x-amz-credential": credential },
        { "x-amz-date": amzDate },
      ],
    } as any;
    const policyB64 = btoa(JSON.stringify(policyDoc));
    const signingKey = await deriveSigningKey(secretAccessKey, yyyymmdd, 'auto', 's3');
    const signature = toHex(await hmac(signingKey, policyB64));
    const postUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
    const post = {
      url: postUrl,
      fields: {
        key,
        bucket,
        "Content-Type": contentType,
        "x-amz-algorithm": "AWS4-HMAC-SHA256",
        "x-amz-credential": credential,
        "x-amz-date": amzDate,
        Policy: policyB64,
        "x-amz-signature": signature,
      },
      expiresAt,
    };

    const enablePut = (process.env.TRYON_UPLOAD_ENABLE_PUT || '').toLowerCase() === 'true';
    const payload: any = enablePut ? {
      method: 'POST',
      post,
      // legacy PUT included only if explicitly enabled
      legacyPut: { uploadUrl, headers: { 'Content-Type': contentType } },
      objectUrl,
      key,
      expiresAt,
    } : { method: 'POST', post, objectUrl, key, expiresAt };
    const res = NextResponse.json(payload);
    if (setCookie) res.headers.append("Set-Cookie", setCookie);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "UNKNOWN", message: err?.message ?? "Unexpected error" } },
      { status: 500 },
    );
  }
}
