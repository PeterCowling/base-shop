import "server-only";

import { MediaError } from "./media.errors";

type R2Config = {
  accountId: string;
  bucket: string;
  publicBase: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_MEDIA;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !bucket || !publicBase || !accessKeyId || !secretAccessKey) return null;

  return {
    accountId,
    bucket,
    publicBase: publicBase.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
  };
}

export function buildR2ObjectEndpoint(config: R2Config, key: string): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
}

export function buildR2PublicUrl(config: R2Config, key: string): string {
  return `${config.publicBase}/${key}`;
}

export async function putObjectToR2(config: R2Config, key: string, contentType: string, body: Uint8Array): Promise<void> {
  const { AwsClient } = await import("aws4fetch");
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const payload: ArrayBuffer = body.slice().buffer;
  const res = await client.fetch(buildR2ObjectEndpoint(config, key), {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: payload,
  });

  if (!res.ok) {
    throw new MediaError("UPLOAD_FAILED");
  }
}

export async function deleteObjectFromR2(config: R2Config, key: string): Promise<void> {
  try {
    const { AwsClient } = await import("aws4fetch");
    const client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: "auto",
    });

    await client.fetch(buildR2ObjectEndpoint(config, key), { method: "DELETE" });
  } catch {
    // best-effort delete
  }
}
