import crypto from "node:crypto";
import path from "node:path";

import aws4 from "aws4";

import { fileExists, loadEnvFile } from "../xa-utils";

export type XaR2Config = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
};

export function resolveR2Host(accountId: string): string {
  return `${accountId}.r2.cloudflarestorage.com`;
}

export function encodeS3Key(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
    .replace(/%2F/g, "/");
}

export function randomIncomingKey(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID().replace(/-/g, "");
  const normalizedPrefix = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${normalizedPrefix}/${date}/incoming.${id}.zip`;
}

export async function loadXaEnvCandidates(options: {
  envFile?: string;
  envName?: string;
}): Promise<void> {
  const envFileArg = options.envFile?.trim();
  const envName = options.envName?.trim();
  const candidates = [
    envFileArg,
    envName ? path.join("apps", "xa-uploader", "data", `.env.xa.${envName}`) : undefined,
    path.join("apps", "xa-uploader", "data", ".env.xa"),
    path.join(process.cwd(), ".env"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      loadEnvFile(candidate);
      break;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadR2Config(overrides?: { prefix?: string }): XaR2Config {
  const accountId = requireEnv("XA_R2_ACCOUNT_ID").trim();
  const bucket = requireEnv("XA_R2_BUCKET").trim();
  const accessKeyId = requireEnv("XA_R2_ACCESS_KEY_ID").trim();
  const secretAccessKey = requireEnv("XA_R2_SECRET_ACCESS_KEY").trim();
  const prefix = (overrides?.prefix || process.env.XA_R2_PREFIX || "submissions/").trim();
  return { accountId, bucket, accessKeyId, secretAccessKey, prefix };
}

export function signR2Request(options: {
  host: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  signQuery?: boolean;
  expires?: number;
  accessKeyId: string;
  secretAccessKey: string;
}): { path: string; headers: Record<string, string> } {
  let path = options.path;
  if (options.signQuery && typeof options.expires === "number" && Number.isFinite(options.expires)) {
    if (!path.includes("X-Amz-Expires=")) {
      const joiner = path.includes("?") ? "&" : "?";
      path = `${path}${joiner}X-Amz-Expires=${encodeURIComponent(String(Math.floor(options.expires)))}`;
    }
  }

  const signed = aws4.sign(
    {
      host: options.host,
      service: "s3",
      region: "auto",
      method: options.method,
      path,
      headers: options.headers,
      signQuery: options.signQuery,
    },
    {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  );

  return {
    path: signed.path || options.path,
    headers: (signed.headers as Record<string, string>) || {},
  };
}

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXmlText(match[1]) : "";
}

export type R2ListObject = {
  key: string;
  etag: string;
  lastModified: string;
  size: number;
};

export function parseListObjectsV2(xml: string): {
  objects: R2ListObject[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
} {
  const objects: R2ListObject[] = [];
  const contentsBlocks = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? [];
  for (const block of contentsBlocks) {
    const key = extractTag(block, "Key");
    if (!key) continue;
    const etag = extractTag(block, "ETag").replaceAll('"', "");
    const lastModified = extractTag(block, "LastModified");
    const sizeRaw = extractTag(block, "Size");
    const size = Number(sizeRaw);
    objects.push({
      key,
      etag,
      lastModified,
      size: Number.isFinite(size) ? size : 0,
    });
  }

  const isTruncated = extractTag(xml, "IsTruncated").toLowerCase() === "true";
  const token = extractTag(xml, "NextContinuationToken");
  return { objects, isTruncated, nextContinuationToken: token ? token : null };
}
