// apps/cms/src/actions/setupSanityBlog.ts
import { ensureAuthorized } from "./common/auth";

interface SanityCredentials {
  projectId: string;
  dataset: string;
  token: string;
}

interface Result {
  success: boolean;
  error?: string;
}

/**
 * Ensures that the Sanity dataset exists and uploads basic blog schema
 * documents so the blog can be used immediately.
 */
export async function setupSanityBlog(
  creds: SanityCredentials,
): Promise<Result> {
  "use server";
  await ensureAuthorized();

  const { projectId, dataset, token } = creds;

  try {
    // Check if dataset exists
    const listRes = await fetch(
      `https://api.sanity.io/v1/projects/${projectId}/datasets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!listRes.ok) {
      throw new Error("Failed to list datasets");
    }
    const json = (await listRes.json()) as { datasets?: { name: string }[] };
    const exists = json.datasets?.some((d) => d.name === dataset);

    if (!exists) {
      // create dataset with public read access
      const createRes = await fetch(
        `https://api.sanity.io/v1/projects/${projectId}/datasets/${dataset}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ aclMode: "public" }),
        },
      );
      if (!createRes.ok) {
        throw new Error("Failed to create dataset");
      }
    }

    // Upload a minimal blog schema (post document)
    const apiVersion = process.env.SANITY_API_VERSION || "2021-10-21";
    const schemaRes = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              createIfNotExists: {
                _id: "schema-post",
                _type: "schema",
                name: "post",
                title: "Post",
                type: "document",
                fields: [
                  { name: "title", type: "string", title: "Title" },
                  { name: "slug", type: "slug", title: "Slug", options: { source: "title" } },
                  { name: "excerpt", type: "text", title: "Excerpt" },
                  {
                    name: "body",
                    title: "Body",
                    type: "array",
                    of: [
                      { type: "block" },
                      {
                        type: "object",
                        name: "productReference",
                        title: "Product",
                        fields: [
                          { name: "slug", type: "string", title: "Product Slug" },
                        ],
                      },
                    ],
                  },
                  { name: "published", type: "boolean", title: "Published" },
                ],
              },
            },
          ],
        }),
      },
    );
    if (!schemaRes.ok) {
      throw new Error("Failed to upload schema");
    }

    return { success: true };
  } catch (err) {
    console.error("[setupSanityBlog]", err);
    return { success: false, error: (err as Error).message };
  }
}

export type { SanityCredentials };
