import { z } from "zod";

import { cfFetch } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  zoneIdSchema,
} from "../utils/validation.js";

const purgeUrlsSchema = zoneIdSchema.extend({
  urls: z.array(z.string().url()).min(1).max(30),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

const purgeEverythingSchema = zoneIdSchema.extend({
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

const purgeByTagSchema = zoneIdSchema.extend({
  tags: z.array(z.string()).min(1).max(30),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

const purgeByPrefixSchema = zoneIdSchema.extend({
  prefixes: z.array(z.string()).min(1).max(30),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

const purgeByHostSchema = zoneIdSchema.extend({
  hosts: z.array(z.string()).min(1).max(30),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

export const cacheTools = [
  {
    name: "cache_purge_urls",
    description: "Purge specific URLs from Cloudflare cache. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        urls: {
          type: "array",
          items: { type: "string" },
          description: "URLs to purge (max 30)",
        },
        confirm: { type: "boolean", description: "⚠️ Set to true to purge cache" },
      },
      required: ["zoneId", "urls"],
    },
  },
  {
    name: "cache_purge_everything",
    description: "Purge ALL cached content for a zone. ⚠️ DESTRUCTIVE: This will clear the entire cache. Requires confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        confirm: { type: "boolean", description: "🚨 Set to true to purge ENTIRE cache" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "cache_purge_by_tag",
    description: "Purge cached content by Cache-Tag header (Enterprise only). Requires confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Cache tags to purge (max 30)",
        },
        confirm: { type: "boolean", description: "⚠️ Set to true to purge by tags" },
      },
      required: ["zoneId", "tags"],
    },
  },
  {
    name: "cache_purge_by_prefix",
    description: "Purge cached content by URL prefix (Enterprise only). Requires confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        prefixes: {
          type: "array",
          items: { type: "string" },
          description: "URL prefixes to purge (max 30)",
        },
        confirm: { type: "boolean", description: "⚠️ Set to true to purge by prefix" },
      },
      required: ["zoneId", "prefixes"],
    },
  },
  {
    name: "cache_purge_by_host",
    description: "Purge cached content by hostname. Requires confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        hosts: {
          type: "array",
          items: { type: "string" },
          description: "Hostnames to purge (max 30)",
        },
        confirm: { type: "boolean", description: "⚠️ Set to true to purge by host" },
      },
      required: ["zoneId", "hosts"],
    },
  },
] as const;

export async function handleCacheTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "cache_purge_urls": {
        const { zoneId, urls, confirm } = purgeUrlsSchema.parse(args);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will PURGE specific URLs from cache. Review and call again with confirm: true to execute.",
            preview: {
              action: "PURGE URLS FROM CACHE",
              zoneId,
              urlCount: urls.length,
              urls: urls.slice(0, 10),
              note: urls.length > 10 ? `... and ${urls.length - 10} more` : undefined,
            },
            toExecute: { zoneId, urls, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/purge_cache`,
          {
            method: "POST",
            body: JSON.stringify({ files: urls }),
          }
        );

        return jsonResult({
          message: "✅ Cache purged successfully",
          purgedUrls: urls.length,
        });
      }

      case "cache_purge_everything": {
        const { zoneId, confirm } = purgeEverythingSchema.parse(args);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "🚨 DESTRUCTIVE: This will PURGE THE ENTIRE CACHE for this zone. All cached content will be removed. This may cause increased origin load. Review carefully and call again with confirm: true to execute.",
            preview: {
              action: "PURGE ENTIRE CACHE",
              zoneId,
              warning: "This will clear ALL cached content for the zone!",
              impact: "Origin server will receive increased traffic until cache rebuilds.",
            },
            toExecute: { zoneId, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/purge_cache`,
          {
            method: "POST",
            body: JSON.stringify({ purge_everything: true }),
          }
        );

        return jsonResult({
          message: "✅ Entire cache purged successfully",
          zoneId,
        });
      }

      case "cache_purge_by_tag": {
        const { zoneId, tags, confirm } = purgeByTagSchema.parse(args);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will PURGE all cached content matching these Cache-Tags. Review and call again with confirm: true to execute.",
            preview: {
              action: "PURGE BY CACHE TAG",
              zoneId,
              tags,
              note: "Requires Enterprise plan",
            },
            toExecute: { zoneId, tags, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/purge_cache`,
          {
            method: "POST",
            body: JSON.stringify({ tags }),
          }
        );

        return jsonResult({
          message: "✅ Cache purged by tags successfully",
          purgedTags: tags,
        });
      }

      case "cache_purge_by_prefix": {
        const { zoneId, prefixes, confirm } = purgeByPrefixSchema.parse(args);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will PURGE all cached content matching these URL prefixes. Review and call again with confirm: true to execute.",
            preview: {
              action: "PURGE BY URL PREFIX",
              zoneId,
              prefixes,
              note: "Requires Enterprise plan",
            },
            toExecute: { zoneId, prefixes, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/purge_cache`,
          {
            method: "POST",
            body: JSON.stringify({ prefixes }),
          }
        );

        return jsonResult({
          message: "✅ Cache purged by prefixes successfully",
          purgedPrefixes: prefixes,
        });
      }

      case "cache_purge_by_host": {
        const { zoneId, hosts, confirm } = purgeByHostSchema.parse(args);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will PURGE all cached content for these hostnames. Review and call again with confirm: true to execute.",
            preview: {
              action: "PURGE BY HOSTNAME",
              zoneId,
              hosts,
            },
            toExecute: { zoneId, hosts, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/purge_cache`,
          {
            method: "POST",
            body: JSON.stringify({ hosts }),
          }
        );

        return jsonResult({
          message: "✅ Cache purged by hosts successfully",
          purgedHosts: hosts,
        });
      }

      default:
        return errorResult(`Unknown cache tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
