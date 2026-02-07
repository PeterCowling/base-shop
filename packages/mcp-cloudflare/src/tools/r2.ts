import { z } from "zod";

import { cfFetch, getAccountId } from "../client.js";
import {
  bucketNameSchema,
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

interface R2Bucket {
  name: string;
  creation_date: string;
  location?: string;
}

interface R2Object {
  key: string;
  size: number;
  uploaded: string;
  etag: string;
  httpEtag: string;
  storageClass: string;
}

interface R2ObjectsResponse {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes?: string[];
}

const listBucketsSchema = z.object({});
const getBucketSchema = bucketNameSchema;
const listObjectsSchema = bucketNameSchema.extend({
  prefix: z.string().optional(),
  delimiter: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
});
const getObjectInfoSchema = bucketNameSchema.extend({
  key: z.string().min(1),
});
const deleteObjectSchema = bucketNameSchema.extend({
  key: z.string().min(1),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

export const r2Tools = [
  {
    name: "r2_list_buckets",
    description: "List all R2 buckets in the account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "r2_get_bucket",
    description: "Get details for a specific R2 bucket",
    inputSchema: {
      type: "object",
      properties: {
        bucketName: { type: "string", description: "The bucket name" },
      },
      required: ["bucketName"],
    },
  },
  {
    name: "r2_list_objects",
    description: "List objects in an R2 bucket",
    inputSchema: {
      type: "object",
      properties: {
        bucketName: { type: "string", description: "The bucket name" },
        prefix: { type: "string", description: "Filter by key prefix" },
        delimiter: { type: "string", description: "Delimiter for hierarchy (e.g., '/')" },
        cursor: { type: "string", description: "Pagination cursor" },
        limit: { type: "number", description: "Max results (1-1000)", default: 100 },
      },
      required: ["bucketName"],
    },
  },
  {
    name: "r2_get_object_info",
    description: "Get metadata for a specific object",
    inputSchema: {
      type: "object",
      properties: {
        bucketName: { type: "string", description: "The bucket name" },
        key: { type: "string", description: "The object key" },
      },
      required: ["bucketName", "key"],
    },
  },
  {
    name: "r2_delete_object",
    description: "Delete an object from R2. ⚠️ DESTRUCTIVE: Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        bucketName: { type: "string", description: "The bucket name" },
        key: { type: "string", description: "The object key to delete" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this DESTRUCTIVE operation" },
      },
      required: ["bucketName", "key"],
    },
  },
] as const;

export async function handleR2Tool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();

    switch (name) {
      case "r2_list_buckets": {
        listBucketsSchema.parse(args);
        const buckets = await cfFetch<{ buckets: R2Bucket[] }>(
          `/accounts/${accountId}/r2/buckets`
        );
        return jsonResult({
          buckets: buckets.buckets.map((b) => ({
            name: b.name,
            createdOn: b.creation_date,
            location: b.location,
          })),
        });
      }

      case "r2_get_bucket": {
        const { bucketName } = getBucketSchema.parse(args);
        const bucket = await cfFetch<R2Bucket>(
          `/accounts/${accountId}/r2/buckets/${bucketName}`
        );
        return jsonResult(bucket);
      }

      case "r2_list_objects": {
        const { bucketName, prefix, delimiter, cursor, limit } =
          listObjectsSchema.parse(args);
        const params = new URLSearchParams();
        if (prefix) params.set("prefix", prefix);
        if (delimiter) params.set("delimiter", delimiter);
        if (cursor) params.set("cursor", cursor);
        params.set("per_page", String(limit));

        const result = await cfFetch<R2ObjectsResponse>(
          `/accounts/${accountId}/r2/buckets/${bucketName}/objects?${params.toString()}`
        );
        return jsonResult({
          objects: result.objects.map((o) => ({
            key: o.key,
            size: o.size,
            uploaded: o.uploaded,
            etag: o.etag,
          })),
          truncated: result.truncated,
          cursor: result.cursor,
          prefixes: result.delimitedPrefixes,
        });
      }

      case "r2_get_object_info": {
        const { bucketName, key } = getObjectInfoSchema.parse(args);
        const object = await cfFetch<R2Object>(
          `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`
        );
        return jsonResult({
          key: object.key,
          size: object.size,
          uploaded: object.uploaded,
          etag: object.etag,
          storageClass: object.storageClass,
        });
      }

      case "r2_delete_object": {
        const { bucketName, key, confirm } = deleteObjectSchema.parse(args);

        // Get object info for preview
        let objectInfo: R2Object | null = null;
        try {
          objectInfo = await cfFetch<R2Object>(
            `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`
          );
        } catch {
          // Object might not exist or we can't get metadata
        }

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "🚨 DESTRUCTIVE: This will DELETE an object from R2. This action CANNOT be undone. Review carefully and call again with confirm: true to execute.",
            preview: {
              action: "DELETE R2 OBJECT",
              bucket: bucketName,
              objectToDelete: objectInfo
                ? {
                    key: objectInfo.key,
                    size: objectInfo.size,
                    uploaded: objectInfo.uploaded,
                    etag: objectInfo.etag,
                  }
                : { key },
              warning: "This object will be permanently deleted!",
            },
            toExecute: { bucketName, key, confirm: true },
          });
        }

        await cfFetch<void>(
          `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`,
          { method: "DELETE" }
        );
        return jsonResult({
          message: "✅ Object deleted successfully",
          bucket: bucketName,
          key,
        });
      }

      default:
        return errorResult(`Unknown R2 tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
