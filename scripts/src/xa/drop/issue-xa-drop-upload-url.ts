import crypto from "node:crypto";
import { parseArgs } from "node:util";

import { loadXaEnvCandidates } from "../r2/xa-r2-utils";

const TOKEN_VERSION = "v1";

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/drop/issue-xa-drop-upload-url.ts [--expires <seconds>] [--count <n>] [--base-url https://drop.example] [--prefix submissions/] [--include-internal-keys] [--env-file <path>] [--env <name>]",
      "",
      "Required env vars:",
      "  XA_DROP_BASE_URL",
      "  XA_DROP_UPLOAD_SECRET",
      "",
      "Optional env vars:",
      "  XA_R2_PREFIX (defaults to submissions/)",
      "",
      "Notes:",
      "  - Prints an upload URL that does not expose your R2 account hostname.",
      "  - Share ONLY the URL with the vendor.",
    ].join("\n"),
  );
}

function requireEnv(name: string, minLength?: number): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  if (minLength && value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
  return value;
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim();
  const withoutLeading = trimmed.replace(/^\/+/, "");
  const withoutTrailing = withoutLeading.replace(/\/+$/, "");
  return withoutTrailing ? `${withoutTrailing}/` : "";
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("XA_DROP_BASE_URL must be http(s).");
  }
  return parsed.toString().replace(/\/+$/, "");
}

function sign(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      expires: { type: "string" },
      count: { type: "string" },
      "base-url": { type: "string" },
      prefix: { type: "string" },
      "include-internal-keys": { type: "boolean", default: false },
      "env-file": { type: "string" },
      env: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  await loadXaEnvCandidates({
    envFile: values["env-file"] ? String(values["env-file"]) : undefined,
    envName: values.env ? String(values.env) : undefined,
  });

  const baseUrl = normalizeBaseUrl(
    values["base-url"] ? String(values["base-url"]) : requireEnv("XA_DROP_BASE_URL"),
  );
  const secret = requireEnv("XA_DROP_UPLOAD_SECRET", 32);

  const expires = Math.max(60, Number(values.expires ?? 15 * 60) || 15 * 60);
  const count = Math.max(1, Number(values.count ?? 1) || 1);
  const prefix = normalizePrefix(
    values.prefix
      ? String(values.prefix)
      : (process.env.XA_R2_PREFIX || "submissions/").trim(),
  );
  const includeInternalKeys = Boolean(values["include-internal-keys"]);

  const issuedAt = Math.floor(Date.now() / 1000);
  const exp = issuedAt + expires;

  const outputs: Array<{ url: string; suggestedKey: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const nonce = crypto.randomBytes(16).toString("base64url");
    const payload = `${TOKEN_VERSION}.${issuedAt}.${exp}.${nonce}`;
    const signature = sign(secret, payload);
    const token = `${payload}.${signature}`;

    const date = new Date(issuedAt * 1000).toISOString().slice(0, 10);
    const suggestedKey = `${prefix}${date}/incoming.${nonce}.zip`;
    outputs.push({ url: `${baseUrl}/upload/${token}`, suggestedKey });
  }

  console.log(`Upload URL${outputs.length === 1 ? "" : "s"} (expires ${expires}s):`);
  for (const out of outputs) {
    console.log(out.url);
  }

  if (includeInternalKeys) {
    console.log("");
    console.log(`Internal R2 key${outputs.length === 1 ? "" : "s"}:`);
    for (const out of outputs) {
      console.log(out.suggestedKey);
    }
  }

  console.log("");
  console.log("Share only the upload URL with the vendor.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
