"use server";

import { createClient } from "@sanity/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";

interface SanityCredentials {
  projectId: string;
  token: string;
  dataset?: string;
}

const DEFAULT_DATASET = "blog";

const DEFAULT_SCHEMAS = [
  {
    name: "post",
    definition: {
      name: "post",
      title: "Post",
      type: "document",
      fields: [
        { name: "title", title: "Title", type: "string" },
        {
          name: "slug",
          title: "Slug",
          type: "slug",
          options: { source: "title" },
        },
        { name: "excerpt", title: "Excerpt", type: "text" },
        {
          name: "body",
          title: "Body",
          type: "array",
          of: [{ type: "block" }],
        },
      ],
    },
  },
  {
    name: "author",
    definition: {
      name: "author",
      title: "Author",
      type: "document",
      fields: [
        { name: "name", title: "Name", type: "string" },
        { name: "bio", title: "Bio", type: "text" },
      ],
    },
  },
];

export async function setupSanityBlog(shop: string): Promise<void> {
  const credsPath = path.join(resolveDataRoot(), shop, "sanity.json");
  const raw = await fs.readFile(credsPath, "utf8");
  const creds = JSON.parse(raw) as SanityCredentials;
  const dataset = creds.dataset || DEFAULT_DATASET;

  const client = createClient({
    projectId: creds.projectId,
    dataset,
    token: creds.token,
    apiVersion: "2025-02-11",
    useCdn: false,
  });

  const datasets = await client.datasets.list();
  if (!datasets.find((d) => d.name === dataset)) {
    await client.datasets.create({ name: dataset });
  }

  for (const schema of DEFAULT_SCHEMAS) {
    await client.request({
      url: `/schemas/${schema.name}`,
      method: "PUT",
      body: schema.definition,
    });
  }
}
