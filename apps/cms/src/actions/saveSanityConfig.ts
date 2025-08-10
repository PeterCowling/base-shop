// apps/cms/src/actions/saveSanityConfig.ts
"use server";

import { verifyCredentials } from "@acme/plugin-sanity";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { ensureAuthorized } from "./common/auth";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function saveSanityConfig(formData: FormData): Promise<{
  error?: string;
}> {
  await ensureAuthorized();

  const projectId = String(formData.get("projectId") ?? "");
  const dataset = String(formData.get("dataset") ?? "");
  const token = String(formData.get("token") ?? "");

  const config = { projectId, dataset, token };

  const valid = await verifyCredentials(config);
  if (!valid) {
    return { error: "Invalid Sanity credentials" };
  }

  const root = path.resolve(resolveDataRoot(), "..", "cms");
  await fs.mkdir(root, { recursive: true });
  const file = path.join(root, "sanity.json");
  await fs.writeFile(file, JSON.stringify(config, null, 2), "utf8");

  return {};
}
