import { z } from "zod";

import { cfFetch, cfFetchWithInfo, getAccountId } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  namespaceIdSchema,
  paginationSchema,
} from "../utils/validation.js";

interface KVNamespace {
  id: string;
  title: string;
  supports_url_encoding?: boolean;
}

interface KVKey {
  name: string;
  expiration?: number;
  metadata?: Record<string, unknown>;
}

const listNamespacesSchema = paginationSchema;
const listKeysSchema = namespaceIdSchema.merge(paginationSchema).extend({
  prefix: z.string().optional(),
  cursor: z.string().optional(),
});
const getValueSchema = namespaceIdSchema.extend({
  key: z.string().min(1),
});
const putValueSchema = namespaceIdSchema.extend({
  key: z.string().min(1),
  value: z.string(),
  expirationTtl: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});
const deleteKeySchema = namespaceIdSchema.extend({
  key: z.string().min(1),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

export const kvTools = [
  {
    name: "kv_list_namespaces",
    description: "List all KV namespaces in the account",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
    },
  },
  {
    name: "kv_list_keys",
    description: "List keys in a KV namespace",
    inputSchema: {
      type: "object",
      properties: {
        namespaceId: { type: "string", description: "The namespace ID" },
        prefix: { type: "string", description: "Filter by key prefix" },
        cursor: { type: "string", description: "Pagination cursor" },
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
      required: ["namespaceId"],
    },
  },
  {
    name: "kv_get_value",
    description: "Get the value for a key in a KV namespace",
    inputSchema: {
      type: "object",
      properties: {
        namespaceId: { type: "string", description: "The namespace ID" },
        key: { type: "string", description: "The key name" },
      },
      required: ["namespaceId", "key"],
    },
  },
  {
    name: "kv_put_value",
    description: "Set a key-value pair in a KV namespace. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        namespaceId: { type: "string", description: "The namespace ID" },
        key: { type: "string", description: "The key name" },
        value: { type: "string", description: "The value to store" },
        expirationTtl: { type: "number", description: "TTL in seconds (optional)" },
        metadata: { type: "object", description: "Key metadata (optional)" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this write operation" },
      },
      required: ["namespaceId", "key", "value"],
    },
  },
  {
    name: "kv_delete_key",
    description: "Delete a key from a KV namespace. ⚠️ DESTRUCTIVE: Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        namespaceId: { type: "string", description: "The namespace ID" },
        key: { type: "string", description: "The key to delete" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this DESTRUCTIVE operation" },
      },
      required: ["namespaceId", "key"],
    },
  },
] as const;

export async function handleKVTool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();

    switch (name) {
      case "kv_list_namespaces": {
        const { page, perPage } = listNamespacesSchema.parse(args);
        const { result, resultInfo } = await cfFetchWithInfo<KVNamespace[]>(
          `/accounts/${accountId}/storage/kv/namespaces?page=${page}&per_page=${perPage}`
        );
        return jsonResult({
          namespaces: result.map((ns) => ({
            id: ns.id,
            title: ns.title,
          })),
          pagination: resultInfo,
        });
      }

      case "kv_list_keys": {
        const { namespaceId, prefix, cursor } = listKeysSchema.parse(args);
        const params = new URLSearchParams();
        if (prefix) params.set("prefix", prefix);
        if (cursor) params.set("cursor", cursor);

        const result = await cfFetch<{
          keys: KVKey[];
          list_complete: boolean;
          cursor?: string;
        }>(
          `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?${params.toString()}`
        );
        return jsonResult({
          keys: result.keys.map((k) => ({
            name: k.name,
            expiration: k.expiration,
            metadata: k.metadata,
          })),
          complete: result.list_complete,
          cursor: result.cursor,
        });
      }

      case "kv_get_value": {
        const { namespaceId, key } = getValueSchema.parse(args);
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return errorResult(`Key not found: ${key}`);
          }
          throw new Error(`Failed to get value: ${response.status}`);
        }

        const value = await response.text();
        return jsonResult({
          key,
          value,
          contentType: response.headers.get("content-type"),
        });
      }

      case "kv_put_value": {
        const { namespaceId, key, value, expirationTtl, metadata, confirm } =
          putValueSchema.parse(args);

        // Try to get existing value for preview
        let existingValue: string | null = null;
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              },
            }
          );
          if (response.ok) {
            existingValue = await response.text();
          }
        } catch {
          // Key doesn't exist or can't be fetched
        }

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: existingValue
              ? "⚠️ This will OVERWRITE an existing KV value. Review and call again with confirm: true to execute."
              : "⚠️ This will CREATE a new KV key-value pair. Review and call again with confirm: true to execute.",
            preview: {
              action: existingValue ? "OVERWRITE KV VALUE" : "CREATE KV VALUE",
              namespaceId,
              key,
              existingValue: existingValue
                ? existingValue.length > 200
                  ? existingValue.substring(0, 200) + "... (truncated)"
                  : existingValue
                : null,
              newValue: value.length > 200 ? value.substring(0, 200) + "... (truncated)" : value,
              expirationTtl,
              metadata,
            },
            toExecute: { namespaceId, key, value, expirationTtl, metadata, confirm: true },
          });
        }

        const params = new URLSearchParams();
        if (expirationTtl) params.set("expiration_ttl", String(expirationTtl));

        const body = metadata
          ? JSON.stringify({ value, metadata })
          : value;

        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}?${params.toString()}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              "Content-Type": metadata ? "application/json" : "text/plain",
            },
            body,
          }
        );

        return jsonResult({
          message: "✅ Value set successfully",
          key,
          expirationTtl,
        });
      }

      case "kv_delete_key": {
        const { namespaceId, key, confirm } = deleteKeySchema.parse(args);

        // Try to get existing value for preview
        let existingValue: string | null = null;
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              },
            }
          );
          if (response.ok) {
            existingValue = await response.text();
          }
        } catch {
          // Key doesn't exist or can't be fetched
        }

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "🚨 DESTRUCTIVE: This will DELETE a KV key. This action CANNOT be undone. Review carefully and call again with confirm: true to execute.",
            preview: {
              action: "DELETE KV KEY",
              namespaceId,
              keyToDelete: key,
              currentValue: existingValue
                ? existingValue.length > 200
                  ? existingValue.substring(0, 200) + "... (truncated)"
                  : existingValue
                : "(unable to fetch)",
              warning: "This key-value pair will be permanently deleted!",
            },
            toExecute: { namespaceId, key, confirm: true },
          });
        }

        await cfFetch<void>(
          `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
          { method: "DELETE" }
        );
        return jsonResult({
          message: "✅ Key deleted successfully",
          key,
        });
      }

      default:
        return errorResult(`Unknown KV tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
