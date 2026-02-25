// apps/cms/src/actions/sanity.server.ts
"use server";

interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
}

const sanityPluginModuleId =
  process.env.ACME_PLUGIN_SANITY_MODULE_ID || "@acme/plugin-sanity";

async function loadSanityPlugin(): Promise<typeof import("@acme/plugin-sanity")> {
  return import(sanityPluginModuleId) as Promise<typeof import("@acme/plugin-sanity")>;
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
  const { verifyCredentials } = await loadSanityPlugin();
  return verifyCredentials(config);
}

export async function createSanityPost(formData: FormData) {
  const config = parseConfig(formData);
  const raw = String(formData.get("post") ?? "{}");
  const post = JSON.parse(raw) as Record<string, unknown>;
  const { publishPost } = await loadSanityPlugin();
  return publishPost(config, post);
}
