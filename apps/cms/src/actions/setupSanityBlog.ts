// apps/cms/src/actions/setupSanityBlog.ts
import { cmsEnv as env } from "@acme/config/env/cms";

import { ensureAuthorized } from "./common/auth";

interface SanityCredentials {
  projectId: string;
  dataset: string;
  token: string;
}

export type SetupSanityBlogErrorCode =
  | "DATASET_LIST_ERROR"
  | "DATASET_CREATE_ERROR"
  | "SCHEMA_UPLOAD_ERROR"
  | "CATEGORY_SEED_ERROR"
  | "UNKNOWN_ERROR";

interface Result {
  success: boolean;
  error?: string;
  code?: SetupSanityBlogErrorCode;
}

/**
 * Ensures that the Sanity dataset exists and uploads basic blog schema
 * documents so the blog can be used immediately.
 */
export async function setupSanityBlog(
  creds: SanityCredentials,
  editorial?: { enabled: boolean; promoteSchedule?: string },
  aclMode: "public" | "private" = "public",
): Promise<Result> {
  "use server";
  await ensureAuthorized();
  if (!editorial?.enabled) return { success: true };
  if (editorial.promoteSchedule) {
    try {
      await fetch(`/api/editorial/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: editorial.promoteSchedule }),
      });
    } catch (err) {
      console.error("[setupSanityBlog] failed to schedule promotion", err);
    }
  }

  const { projectId, dataset, token } = creds;

  try {
    // Check if dataset exists
    const listRes = await fetch(
      `https://api.sanity.io/v1/projects/${projectId}/datasets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ).catch((err) => {
      console.error("[setupSanityBlog]", err);
      return null;
    });
    if (!listRes || !listRes.ok) {
      return {
        success: false,
        error: "Failed to list datasets",
        code: "DATASET_LIST_ERROR",
      };
    }
    const json = (await listRes.json()) as { datasets?: { name: string }[] };
    const exists = json.datasets?.some((d) => d.name === dataset);

    if (!exists) {
      // create dataset with requested access mode
      const createRes = await fetch(
        `https://api.sanity.io/v1/projects/${projectId}/datasets/${dataset}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ aclMode }),
        },
      ).catch((err) => {
        console.error("[setupSanityBlog]", err);
        return null;
      });
      if (!createRes || !createRes.ok) {
        return {
          success: false,
          error: "Failed to create dataset",
          code: "DATASET_CREATE_ERROR",
        };
      }
    }

    // Upload a minimal blog schema (post document)
    const apiVersion = env.SANITY_API_VERSION || "2021-10-21";
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
              createOrReplace: {
                _id: "schema-post",
                _type: "schema",
                name: "post",
                title: "Post",
                type: "document",
                fields: [
                  { name: "title", type: "string", title: "Title" },
                  { name: "slug", type: "slug", title: "Slug", options: { source: "title" } },
                  { name: "excerpt", type: "text", title: "Excerpt" },
                  { name: "mainImage", type: "image", title: "Main Image" },
                  { name: "author", type: "string", title: "Author" },
                  {
                    name: "categories",
                    type: "array",
                    title: "Categories",
                    of: [{ type: "reference", to: [{ type: "category" }] }],
                  },
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
                  {
                    name: "publishedAt",
                    type: "datetime",
                    title: "Published At",
                    description: "Schedule publish time",
                  },
                  {
                    name: "products",
                    type: "array",
                    title: "Products",
                    of: [{ type: "string" }],
                    description: "Shop product IDs or slugs",
                  },
                ],
              },
            },
            {
              createOrReplace: {
                _id: "schema-category",
                _type: "schema",
                name: "category",
                title: "Category",
                type: "document",
                fields: [
                  { name: "title", type: "string", title: "Title" },
                  {
                    name: "slug",
                    type: "slug",
                    title: "Slug",
                    options: { source: "title" },
                  },
                ],
              },
            },
          ],
        }),
      },
    ).catch((err) => {
      console.error("[setupSanityBlog]", err);
      return null;
    });
    if (!schemaRes || !schemaRes.ok) {
      return {
        success: false,
        error: "Failed to upload schema",
        code: "SCHEMA_UPLOAD_ERROR",
      };
    }

    // Seed default Daily Editorial category
    const categoryRes = await fetch(
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
                _id: "category-daily-editorial",
                _type: "category",
                title: "Daily Editorial",
                slug: { _type: "slug", current: "daily-editorial" },
              },
            },
          ],
        }),
      },
    ).catch((err) => {
      console.error("[setupSanityBlog]", err);
      return null;
    });
    if (!categoryRes || !categoryRes.ok) {
      return {
        success: false,
        error: "Failed to seed category",
        code: "CATEGORY_SEED_ERROR",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[setupSanityBlog]", err);
    return {
      success: false,
      error: (err as Error).message,
      code: "UNKNOWN_ERROR",
    };
  }
}

export type { SanityCredentials };
