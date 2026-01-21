import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  pageSlugSchema,
  paginationSchema,
  shopIdSchema,
} from "../utils/validation.js";

const listPagesSchema = paginationSchema.merge(shopIdSchema);
const getPageSchema = pageSlugSchema;

const createPageSchema = z.object({
  shopId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

const updatePageSchema = z.object({
  shopId: z.string().min(1),
  pageId: z.string().min(1),
  slug: z.string().optional(),
  title: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export const pageTools = [
  {
    name: "page_list",
    description: "List all pages for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        limit: { type: "number", description: "Max results (1-100)", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
      required: ["shopId"],
    },
  },
  {
    name: "page_get",
    description: "Get a page by shop ID and slug",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        slug: { type: "string", description: "The page slug" },
      },
      required: ["shopId", "slug"],
    },
  },
  {
    name: "page_create",
    description: "Create a new page for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        slug: { type: "string", description: "The page slug" },
        title: { type: "string", description: "The page title" },
        data: { type: "object", description: "Additional page data" },
      },
      required: ["shopId", "slug"],
    },
  },
  {
    name: "page_update",
    description: "Update an existing page",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        pageId: { type: "string", description: "The page ID" },
        slug: { type: "string", description: "New page slug" },
        title: { type: "string", description: "New page title" },
        data: { type: "object", description: "Updated page data" },
      },
      required: ["shopId", "pageId"],
    },
  },
] as const;

export async function handlePageTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "page_list": {
        const { shopId, limit, offset } = listPagesSchema.parse(args);
        const { getPages } = await import(
          "@acme/platform-core/repositories/pages/index.server"
        );
        const pages = await getPages(shopId);
        const paginated = pages.slice(offset, offset + limit);
        return jsonResult({
          pages: paginated.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: (p as { title?: string }).title,
          })),
          total: pages.length,
          limit,
          offset,
        });
      }

      case "page_get": {
        const { shopId, slug } = getPageSchema.parse(args);
        const { getPages } = await import(
          "@acme/platform-core/repositories/pages/index.server"
        );
        const pages = await getPages(shopId);
        const page = pages.find((p) => p.slug === slug);
        if (!page) {
          return errorResult(`Page not found: ${shopId}/${slug}`);
        }
        return jsonResult(page);
      }

      case "page_create": {
        const { shopId, slug, title, data } = createPageSchema.parse(args);
        const { savePage } = await import(
          "@acme/platform-core/repositories/pages/index.server"
        );
        const { ulid } = await import("ulid");
        const { nowIso } = await import("@acme/date-utils");
        const newPage = {
          id: ulid(),
          slug,
          title: title ?? slug,
          blocks: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...data,
        };
        const saved = await savePage(shopId, newPage as never);
        return jsonResult(saved);
      }

      case "page_update": {
        const { shopId, pageId, ...updates } = updatePageSchema.parse(args);
        const { getPages, updatePage } = await import(
          "@acme/platform-core/repositories/pages/index.server"
        );
        const { nowIso } = await import("@acme/date-utils");
        const pages = await getPages(shopId);
        const existing = pages.find((p) => p.id === pageId);
        if (!existing) {
          return errorResult(`Page not found: ${pageId}`);
        }
        const patch = {
          id: pageId,
          updatedAt: nowIso(),
          ...updates,
        };
        const updated = await updatePage(shopId, patch as never, existing);
        return jsonResult(updated);
      }

      default:
        return errorResult(`Unknown page tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
