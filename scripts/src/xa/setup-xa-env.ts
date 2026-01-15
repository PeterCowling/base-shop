import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { fileExists, loadEnvFile } from "./xa-utils";

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/setup-xa-env.ts [--env <name>] [--env-file <path>] [--account-id <id>] [--token <token>] [--write-samples] [--force] [--skip-validate]",
      "",
      "Notes:",
      "  - Writes XA_CLOUDFLARE_ACCOUNT_ID and XA_CLOUDFLARE_IMAGES_TOKEN to an env file for the XA pipeline.",
      "  - Use a separate Cloudflare account for stealth mode.",
    ].join("\n"),
  );
}

async function maybeCopySample(
  sourcePath: string,
  destPath: string,
  options: { force: boolean },
): Promise<"skipped" | "written"> {
  if (!options.force && (await fileExists(destPath))) return "skipped";
  await mkdir(path.dirname(destPath), { recursive: true });
  await copyFile(sourcePath, destPath);
  return "written";
}

async function validateCloudflareCreds(accountId: string, token: string): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?page=1&per_page=1`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; errors?: unknown };
  if (!res.ok || json.success === false) {
    throw new Error(`Cloudflare validation failed (HTTP ${res.status}).`);
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      env: { type: "string" },
      "env-file": { type: "string" },
      "account-id": { type: "string" },
      token: { type: "string" },
      "write-samples": { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      "skip-validate": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const envName = values.env ? String(values.env) : undefined;
  const envFile =
    (values["env-file"] ? String(values["env-file"]) : undefined) ||
    path.join(
      "apps",
      "xa-uploader",
      "data",
      envName ? `.env.xa.${envName}` : ".env.xa",
    );

  const accountId = values["account-id"]
    ? String(values["account-id"])
    : process.env.XA_CLOUDFLARE_ACCOUNT_ID || "";
  const token = values.token
    ? String(values.token)
    : process.env.XA_CLOUDFLARE_IMAGES_TOKEN || "";

  let resolvedAccountId = accountId;
  let resolvedToken = token;
  if (!resolvedAccountId || !resolvedToken) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!resolvedAccountId) {
        resolvedAccountId = (await rl.question("Cloudflare account id: ")).trim();
      }
      if (!resolvedToken) {
        console.log("Cloudflare token input will be echoed. Paste then press Enter.");
        resolvedToken = (await rl.question("Cloudflare Images token: ")).trim();
      }
    } finally {
      rl.close();
    }
  }
  if (!resolvedAccountId || !resolvedToken) {
    printUsage();
    throw new Error("Missing Cloudflare credentials.");
  }

  await mkdir(path.dirname(envFile), { recursive: true });
  await writeFile(
    envFile,
    [
      `XA_CLOUDFLARE_ACCOUNT_ID=${resolvedAccountId}`,
      `XA_CLOUDFLARE_IMAGES_TOKEN=${resolvedToken}`,
      "",
    ].join("\n"),
    "utf8",
  );

  loadEnvFile(envFile);

  if (!values["skip-validate"]) {
    await validateCloudflareCreds(resolvedAccountId, resolvedToken);
    console.log("Cloudflare credentials validated.");
  } else {
    console.log("Skipped Cloudflare credential validation.");
  }

  if (values["write-samples"]) {
    const force = Boolean(values.force);
    const productsSample = path.join("apps", "xa-uploader", "data", "products.sample.csv");
    const imagesSample = path.join("apps", "xa-uploader", "data", "images.sample.csv");
    const productsDest = path.join("apps", "xa-uploader", "data", "products.csv");
    const imagesDest = path.join("apps", "xa-uploader", "data", "images.csv");
    const productsStatus = await maybeCopySample(productsSample, productsDest, { force });
    const imagesStatus = await maybeCopySample(imagesSample, imagesDest, { force });
    console.log(`products.csv: ${productsStatus} | images.csv: ${imagesStatus}`);
  }

  console.log(`Wrote env file: ${envFile}`);
  console.log(
    `Next: pnpm xa:validate --products apps/xa-uploader/data/products.csv --images apps/xa-uploader/data/images.csv`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
