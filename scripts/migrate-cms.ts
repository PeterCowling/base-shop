import fetch from "cross-fetch";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function pushSchema(name: string, file: string): Promise<void> {
  const url = `${process.env.CMS_SPACE_URL}/schemas/${name}`;
  const body = await readFile(file, "utf8");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.CMS_ACCESS_TOKEN ?? ""}`,
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
  const root = join(
    __dirname,
    "..",
    "packages",
    "platform-core",
    "repositories",
    "pages"
  );
  await pushSchema("page", join(root, "schema.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
