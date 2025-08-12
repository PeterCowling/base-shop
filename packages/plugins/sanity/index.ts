// packages/plugins/sanity/index.ts
import type { Plugin } from "@acme/platform-core/plugins";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";

export const configSchema = z.object({
  projectId: z.string(),
  dataset: z.string(),
  token: z.string(),
});

export type SanityConfig = z.infer<typeof configSchema>;

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

export async function query<T>(config: SanityConfig, q: string): Promise<T> {
  const client = getClient(config);
  return client.fetch(q);
}

interface MutateBody {
  mutations: unknown[];
  returnIds?: boolean;
}

export async function mutate(config: SanityConfig, body: MutateBody) {
  const client = getClient(config);
  const { mutations, returnIds } = body;
  return client.mutate(mutations, returnIds ? { returnIds } : {});
}

export async function slugExists(
  config: SanityConfig,
  slug: string,
  excludeId?: string,
) {
  const queryStr = `*[_type=="post" && slug.current=="${slug}"${excludeId ? ` && _id!="${excludeId}"` : ""}][0]._id`;
  const res = await query<{ _id?: string } | null>(config, queryStr);
  return Boolean(res?._id);
}

const sanityPlugin: Plugin<any, any, any, SanityConfig> = {
  id: "sanity",
  name: "Sanity",
  description: "Sanity CMS integration",
  defaultConfig,
  configSchema,
};

export default sanityPlugin;
