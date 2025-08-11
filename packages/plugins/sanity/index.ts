// packages/plugins/sanity/index.ts
import type { Plugin } from "@acme/platform-core/plugins";
import { createClient, type SanityClient } from "@sanity/client";

interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
}

export const defaultConfig: SanityConfig = {
  projectId: "",
  dataset: "",
  token: "",
};

function getClient(config: SanityConfig): SanityClient {
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    token: config.token,
    apiVersion: "2023-01-01",
    useCdn: false,
  });
}

export async function verifyCredentials(config: SanityConfig): Promise<boolean> {
  const client = getClient(config);
  try {
    await client.datasets.get(config.dataset);
    return true;
  } catch {
    return false;
  }
}

export async function publishPost(
  config: SanityConfig,
  post: Record<string, unknown>,
) {
  const client = getClient(config);
  return client.create({ _type: "post", ...post });
}

const sanityPlugin: Plugin = {
  id: "sanity",
  name: "Sanity",
  description: "Sanity CMS integration",
  defaultConfig,
};

export default sanityPlugin;
