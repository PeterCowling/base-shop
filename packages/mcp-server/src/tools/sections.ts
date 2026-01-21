import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  sectionFilterSchema,
} from "../utils/validation.js";

const listSectionsSchema = sectionFilterSchema;

const getSectionSchema = z.object({
  shopId: z.string().min(1),
  sectionId: z.string().min(1),
});

const createSectionSchema = z.object({
  shopId: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  data: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateSectionSchema = z.object({
  shopId: z.string().min(1),
  sectionId: z.string().min(1),
  label: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  data: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

export const sectionTools = [
  {
    name: "section_list",
    description: "List section templates for a shop with optional status filter",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        status: {
          type: "string",
          enum: ["draft", "published"],
          description: "Filter by status",
        },
        limit: { type: "number", description: "Max results (1-100)", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
      required: ["shopId"],
    },
  },
  {
    name: "section_get",
    description: "Get a section template by ID",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        sectionId: { type: "string", description: "The section template ID" },
      },
      required: ["shopId", "sectionId"],
    },
  },
  {
    name: "section_create",
    description: "Create a new section template",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        label: { type: "string", description: "Section label/name" },
        status: {
          type: "string",
          enum: ["draft", "published"],
          description: "Initial status",
        },
        data: { type: "object", description: "Section data/blocks" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for organization",
        },
      },
      required: ["shopId", "label"],
    },
  },
  {
    name: "section_update",
    description: "Update an existing section template",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        sectionId: { type: "string", description: "The section template ID" },
        label: { type: "string", description: "New label" },
        status: { type: "string", enum: ["draft", "published"] },
        data: { type: "object", description: "Updated data/blocks" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["shopId", "sectionId"],
    },
  },
] as const;

export async function handleSectionTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "section_list": {
        const { shopId, status, limit, offset } = listSectionsSchema.parse(args);
        const { getSections } = await import(
          "@acme/platform-core/repositories/sections/index.server"
        );
        let sections = await getSections(shopId);
        if (status) {
          sections = sections.filter((s) => s.status === status);
        }
        const paginated = sections.slice(offset, offset + limit);
        return jsonResult({
          sections: paginated.map((s) => ({
            id: s.id,
            label: s.label,
            status: s.status,
            tags: s.tags,
          })),
          total: sections.length,
          limit,
          offset,
        });
      }

      case "section_get": {
        const { shopId, sectionId } = getSectionSchema.parse(args);
        const { getSections } = await import(
          "@acme/platform-core/repositories/sections/index.server"
        );
        const sections = await getSections(shopId);
        const section = sections.find((s) => s.id === sectionId);
        if (!section) {
          return errorResult(`Section not found: ${sectionId}`);
        }
        return jsonResult(section);
      }

      case "section_create": {
        const { shopId, label, status, data, tags } = createSectionSchema.parse(args);
        const { saveSection } = await import(
          "@acme/platform-core/repositories/sections/index.server"
        );
        const { ulid } = await import("ulid");
        const { nowIso } = await import("@acme/date-utils");
        const newSection = {
          id: ulid(),
          label,
          status,
          tags: tags ?? [],
          data: data ?? {},
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        const saved = await saveSection(shopId, newSection as never);
        return jsonResult(saved);
      }

      case "section_update": {
        const { shopId, sectionId, ...updates } = updateSectionSchema.parse(args);
        const { getSections, updateSection } = await import(
          "@acme/platform-core/repositories/sections/index.server"
        );
        const { nowIso } = await import("@acme/date-utils");
        const sections = await getSections(shopId);
        const existing = sections.find((s) => s.id === sectionId);
        if (!existing) {
          return errorResult(`Section not found: ${sectionId}`);
        }
        const patch = {
          id: sectionId,
          updatedAt: nowIso(),
          ...updates,
        };
        const updated = await updateSection(shopId, patch as never, existing);
        return jsonResult(updated);
      }

      default:
        return errorResult(`Unknown section tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
