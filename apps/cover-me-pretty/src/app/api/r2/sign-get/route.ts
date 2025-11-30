import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AwsClient } from "aws4fetch";

export const runtime = "edge";

const Query = z.object({ key: z.string() });

type AwsSignedRequest = Request & { url?: string };

function uidFromCookie(req: NextRequest): string | null {
  try {
    return req.cookies.get("tryon.uid")?.value ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({ key: url.searchParams.get("key") });
    if (!parsed.success) {
      // i18n-exempt -- DS-TRYON-GET-400 [ttl=2026-01-31] API error token; surfaced as JSON, not UI copy
      return NextResponse.json({ error: "bad key" }, { status: 400 });
    }
    const key = parsed.data.key;
    // Enforce key format and ownership
    const uid = uidFromCookie(req);
    if (!key.startsWith("tryon/") || !uid || !key.includes(`/${uid}/`)) {
      // i18n-exempt -- DS-TRYON-GET-403 [ttl=2026-01-31] API error token; surfaced as JSON, not UI copy
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_TRYON;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      // i18n-exempt -- DS-TRYON-GET-500 [ttl=2026-01-31] API error token; surfaced as JSON, not UI copy
      return NextResponse.json({ error: "misconfigured" }, { status: 500 });
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });
    const signed = (await client.sign(endpoint, {
      method: "GET",
      signQuery: true,
      expires: 120,
    } as RequestInit)) as AwsSignedRequest;
    const signedUrl = signed.url ?? String(signed);
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    return NextResponse.json({ url: signedUrl, expiresAt });
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
    // i18n-exempt -- DS-TRYON-GET-UNEXPECTED [ttl=2026-01-31] API error token; surfaced as JSON, not UI copy
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
