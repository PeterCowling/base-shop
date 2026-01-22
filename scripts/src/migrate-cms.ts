// scripts/src/migrate-cms.ts
/**
 * Push page and shop schemas to a headless CMS.  This version closely follows
 * the original implementation from the base-shop repository, but uses a
 * simplified environment schema.  It reads JSON schema files from the
 * platform-core repositories and sends them to the CMS using the
 * `cross-fetch` package.  Any errors reading files or making HTTP requests are
 * reported to stderr.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import fetch from "cross-fetch";

import type { CliEnv } from "./types/env";
import { CliEnvSchema } from "./types/env";

let env: CliEnv;
try {
  env = CliEnvSchema.parse(process.env);
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

async function pushSchema(name: string, file: string): Promise<void> {
  const url = `${env.CMS_SPACE_URL}/schemas/${name}`;
  let body: string;
  try {
    body = await readFile(file, "utf8");
  } catch (err) {
    console.error(`Failed to read ${file}:`, err);
    return;
  }
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.CMS_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to push ${name}: ${res.status} ${text}`);
    }
    console.log(`→ pushed ${name}`);
  } catch (err) {
    console.error(`Failed to push ${name}:`, err);
  }
}

async function main(): Promise<void> {
  // Locate the schema files relative to the repository root.  In a real
  // repository these JSON files define the structure of CMS content models.
  const base = join(
    __dirname,
    "..",
    "packages",
    "platform-core",
    "repositories"
  );
  await pushSchema("page", join(base, "pages", "schema.json"));
  await pushSchema("shop", join(base, "shops", "schema.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
