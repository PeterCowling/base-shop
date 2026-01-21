// packages/plugins/sanity/index.ts
import { createClient, type Mutation,type SanityClient } from "@sanity/client";
import { z } from "zod";

import type { Plugin } from "@acme/types";

export const configSchema = z
  .object({
    projectId: z.string(),
    dataset: z.string(),
    token: z.string(),
  })
  .strict();

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
    const datasets = await client.datasets.list();
    return datasets.some((d) => d.name === config.dataset);
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
  mutations: Mutation<Record<string, unknown>>[];
  returnIds?: boolean;
}

export async function mutate(config: SanityConfig, body: MutateBody) {
  const client = getClient(config);
  const { mutations, returnIds } = body;
  return client.mutate(
    mutations,
    returnIds ? { returnDocuments: false } : {}
  );
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

const sanityPlugin: Plugin<SanityConfig> = {
  id: "sanity",
  name: "Sanity", // i18n-exempt -- DX-1023 [ttl=2026-12-31] Plugin metadata; not user-facing yet
  description: "Sanity CMS integration", // i18n-exempt -- DX-1023 [ttl=2026-12-31] Plugin metadata; not user-facing yet
  defaultConfig,
  configSchema,
};

export default sanityPlugin;
