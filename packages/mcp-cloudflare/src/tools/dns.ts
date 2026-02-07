import { z } from "zod";

import { cfFetch, cfFetchWithInfo } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  zoneIdSchema,
} from "../utils/validation.js";

interface Zone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  name_servers: string[];
  created_on: string;
  modified_on: string;
}

interface DnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  proxiable: boolean;
  ttl: number;
  created_on: string;
  modified_on: string;
  priority?: number;
}

const listZonesSchema = paginationSchema.extend({
  name: z.string().optional(),
});
const getZoneSchema = zoneIdSchema;
const listRecordsSchema = zoneIdSchema.merge(paginationSchema).extend({
  type: z.string().optional(),
  name: z.string().optional(),
});
const createRecordSchema = zoneIdSchema.extend({
  type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS", "SRV"]),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().optional().default(1),
  proxied: z.boolean().optional().default(false),
  priority: z.number().optional(),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});
const updateRecordSchema = zoneIdSchema.extend({
  recordId: z.string().min(1),
  type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS", "SRV"]).optional(),
  name: z.string().optional(),
  content: z.string().optional(),
  ttl: z.number().optional(),
  proxied: z.boolean().optional(),
  priority: z.number().optional(),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});
const deleteRecordSchema = zoneIdSchema.extend({
  recordId: z.string().min(1),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

export const dnsTools = [
  {
    name: "dns_list_zones",
    description: "List all DNS zones in the account",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Filter by zone name" },
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
    },
  },
  {
    name: "dns_get_zone",
    description: "Get details for a specific DNS zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "dns_list_records",
    description: "List DNS records for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        type: { type: "string", description: "Filter by record type (A, CNAME, etc.)" },
        name: { type: "string", description: "Filter by record name" },
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "dns_create_record",
    description: "Create a new DNS record. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        type: { type: "string", enum: ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "SRV"] },
        name: { type: "string", description: "Record name (e.g., 'www' or 'example.com')" },
        content: { type: "string", description: "Record content (IP, hostname, etc.)" },
        ttl: { type: "number", description: "TTL in seconds (1 = auto)", default: 1 },
        proxied: { type: "boolean", description: "Enable Cloudflare proxy", default: false },
        priority: { type: "number", description: "Priority (for MX records)" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this write operation" },
      },
      required: ["zoneId", "type", "name", "content"],
    },
  },
  {
    name: "dns_update_record",
    description: "Update an existing DNS record. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        recordId: { type: "string", description: "The record ID" },
        type: { type: "string", enum: ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "SRV"] },
        name: { type: "string", description: "Record name" },
        content: { type: "string", description: "Record content" },
        ttl: { type: "number", description: "TTL in seconds" },
        proxied: { type: "boolean", description: "Enable Cloudflare proxy" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this write operation" },
      },
      required: ["zoneId", "recordId"],
    },
  },
  {
    name: "dns_delete_record",
    description: "Delete a DNS record. ⚠️ DESTRUCTIVE: Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        recordId: { type: "string", description: "The record ID to delete" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute this DESTRUCTIVE operation" },
      },
      required: ["zoneId", "recordId"],
    },
  },
] as const;

export async function handleDnsTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "dns_list_zones": {
        const { name: zoneName, page, perPage } = listZonesSchema.parse(args);
        let url = `/zones?page=${page}&per_page=${perPage}`;
        if (zoneName) {
          url += `&name=${encodeURIComponent(zoneName)}`;
        }
        const { result, resultInfo } = await cfFetchWithInfo<Zone[]>(url);
        return jsonResult({
          zones: result.map((z) => ({
            id: z.id,
            name: z.name,
            status: z.status,
            paused: z.paused,
            nameServers: z.name_servers,
          })),
          pagination: resultInfo,
        });
      }

      case "dns_get_zone": {
        const { zoneId } = getZoneSchema.parse(args);
        const zone = await cfFetch<Zone>(`/zones/${zoneId}`);
        return jsonResult(zone);
      }

      case "dns_list_records": {
        const { zoneId, type, name: recordName, page, perPage } = listRecordsSchema.parse(args);
        let url = `/zones/${zoneId}/dns_records?page=${page}&per_page=${perPage}`;
        if (type) url += `&type=${type}`;
        if (recordName) url += `&name=${encodeURIComponent(recordName)}`;
        const { result, resultInfo } = await cfFetchWithInfo<DnsRecord[]>(url);
        return jsonResult({
          records: result.map((r) => ({
            id: r.id,
            type: r.type,
            name: r.name,
            content: r.content,
            proxied: r.proxied,
            ttl: r.ttl,
            priority: r.priority,
          })),
          pagination: resultInfo,
        });
      }

      case "dns_create_record": {
        const { zoneId, type, name: recordName, content, ttl, proxied, priority, confirm } =
          createRecordSchema.parse(args);

        // Fetch zone name for preview
        const zone = await cfFetch<Zone>(`/zones/${zoneId}`);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will CREATE a new DNS record. Review and call again with confirm: true to execute.",
            preview: {
              action: "CREATE DNS RECORD",
              zone: zone.name,
              record: {
                type,
                name: recordName,
                content,
                ttl: ttl === 1 ? "auto" : ttl,
                proxied,
                priority,
              },
            },
            toExecute: { zoneId, type, name: recordName, content, ttl, proxied, priority, confirm: true },
          });
        }

        const body: Record<string, unknown> = {
          type,
          name: recordName,
          content,
          ttl,
          proxied,
        };
        if (priority !== undefined) body.priority = priority;

        const record = await cfFetch<DnsRecord>(
          `/zones/${zoneId}/dns_records`,
          { method: "POST", body: JSON.stringify(body) }
        );
        return jsonResult({
          message: "✅ DNS record created successfully",
          record: {
            id: record.id,
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl,
          },
        });
      }

      case "dns_update_record": {
        const { zoneId, recordId, confirm, ...updates } = updateRecordSchema.parse(args);
        const existing = await cfFetch<DnsRecord>(
          `/zones/${zoneId}/dns_records/${recordId}`
        );
        const zone = await cfFetch<Zone>(`/zones/${zoneId}`);

        const proposedChanges = {
          type: updates.type ?? existing.type,
          name: updates.name ?? existing.name,
          content: updates.content ?? existing.content,
          ttl: updates.ttl ?? existing.ttl,
          proxied: updates.proxied ?? existing.proxied,
        };

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will UPDATE an existing DNS record. Review and call again with confirm: true to execute.",
            preview: {
              action: "UPDATE DNS RECORD",
              zone: zone.name,
              current: {
                id: existing.id,
                type: existing.type,
                name: existing.name,
                content: existing.content,
                ttl: existing.ttl,
                proxied: existing.proxied,
              },
              proposed: proposedChanges,
              changes: Object.entries(updates)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => `${k}: ${(existing as unknown as Record<string, unknown>)[k]} → ${v}`),
            },
            toExecute: { zoneId, recordId, ...updates, confirm: true },
          });
        }

        const record = await cfFetch<DnsRecord>(
          `/zones/${zoneId}/dns_records/${recordId}`,
          { method: "PUT", body: JSON.stringify(proposedChanges) }
        );
        return jsonResult({
          message: "✅ DNS record updated successfully",
          record: {
            id: record.id,
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl,
          },
        });
      }

      case "dns_delete_record": {
        const { zoneId, recordId, confirm } = deleteRecordSchema.parse(args);

        // Always fetch the record to show what will be deleted
        const existing = await cfFetch<DnsRecord>(
          `/zones/${zoneId}/dns_records/${recordId}`
        );
        const zone = await cfFetch<Zone>(`/zones/${zoneId}`);

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "🚨 DESTRUCTIVE: This will DELETE a DNS record. This action CANNOT be undone. Review carefully and call again with confirm: true to execute.",
            preview: {
              action: "DELETE DNS RECORD",
              zone: zone.name,
              recordToDelete: {
                id: existing.id,
                type: existing.type,
                name: existing.name,
                content: existing.content,
                ttl: existing.ttl,
                proxied: existing.proxied,
              },
              warning: "Deleting this record may break services pointing to this DNS entry!",
            },
            toExecute: { zoneId, recordId, confirm: true },
          });
        }

        await cfFetch<{ id: string }>(
          `/zones/${zoneId}/dns_records/${recordId}`,
          { method: "DELETE" }
        );
        return jsonResult({
          message: "✅ DNS record deleted successfully",
          deletedRecord: {
            id: existing.id,
            type: existing.type,
            name: existing.name,
            content: existing.content,
          },
        });
      }

      default:
        return errorResult(`Unknown DNS tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
