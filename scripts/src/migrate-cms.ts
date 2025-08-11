import { env as baseEnv, envSchema } from "@acme/config";
import fetch from "cross-fetch";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const cliEnvSchema = envSchema.extend({
  CMS_SPACE_URL: z.string().min(1),
  CMS_ACCESS_TOKEN: z.string().min(1),
});

let env: z.infer<typeof cliEnvSchema>;
try {
  env = cliEnvSchema.parse(baseEnv);
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

async function pushSchema(name: string, file: string): Promise<void> {
  const url = `${env.CMS_SPACE_URL}/schemas/${name}`;
  const body = await readFile(file, "utf8");
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
}

async function main(): Promise<void> {
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
