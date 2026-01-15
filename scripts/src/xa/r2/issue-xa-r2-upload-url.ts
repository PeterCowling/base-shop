import { parseArgs } from "node:util";

import {
  encodeS3Key,
  loadR2Config,
  loadXaEnvCandidates,
  randomIncomingKey,
  resolveR2Host,
  signR2Request,
} from "./xa-r2-utils";

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/r2/issue-xa-r2-upload-url.ts [--key <object-key>] [--prefix <prefix>] [--expires <seconds>] [--content-type application/zip] [--env-file <path>] [--env <name>]",
      "",
      "Required env vars (R2):",
      "  XA_R2_ACCOUNT_ID, XA_R2_BUCKET, XA_R2_ACCESS_KEY_ID, XA_R2_SECRET_ACCESS_KEY",
      "",
      "Notes:",
      "  - Generates a presigned PUT URL (one object key).",
      "  - Share the URL with the vendor; they can paste it into the uploader UI and click Upload to R2.",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      key: { type: "string" },
      prefix: { type: "string" },
      expires: { type: "string" },
      "content-type": { type: "string" },
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

  const expires = Math.max(60, Number(values.expires ?? 15 * 60) || 15 * 60);
  const contentType = values["content-type"] ? String(values["content-type"]) : "application/zip";
  const prefixArg = values.prefix ? String(values.prefix) : undefined;

  const r2 = loadR2Config({ prefix: prefixArg });
  const host = resolveR2Host(r2.accountId);

  const objectKey = values.key ? String(values.key) : randomIncomingKey(r2.prefix);
  const encodedKey = encodeS3Key(objectKey);
  const objectPath = `/${r2.bucket}/${encodedKey}`;

  const signed = signR2Request({
    host,
    method: "PUT",
    path: objectPath,
    headers: { "Content-Type": contentType },
    signQuery: true,
    expires,
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  });

  const url = `https://${host}${signed.path}`;
  const destination = `r2://${r2.bucket}/${r2.prefix.replace(/^\/+/, "")}`;

  console.log(`R2 destination: ${destination}`);
  console.log(`R2 key: ${objectKey}`);
  console.log(`Presigned PUT URL (expires ${expires}s):`);
  console.log(url);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
