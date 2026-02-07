// apps/cms/src/actions/sanity.server.ts
"use server";

import { publishPost,verifyCredentials } from "@acme/plugin-sanity";

interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
}

function parseConfig(formData: FormData): SanityConfig {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    dataset: String(formData.get("dataset") ?? ""),
    token: String(formData.get("token") ?? ""),
  };
}

export async function connectSanity(formData: FormData) {
  const config = parseConfig(formData);
  return verifyCredentials(config);
}

export async function createSanityPost(formData: FormData) {
  const config = parseConfig(formData);
  const raw = String(formData.get("post") ?? "{}");
  const post = JSON.parse(raw) as Record<string, unknown>;
  return publishPost(config, post);
}
