import { cfFetch, getAccountId } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

interface Worker {
  id: string;
  name: string;
  created_on?: string;
  modified_on?: string;
  etag?: string;
}

interface WorkerScript {
  id: string;
  handlers: string[];
  last_deployed_from?: string;
  logpush?: boolean;
  placement_mode?: string;
  tail_consumers?: Array<{ service: string; environment?: string }>;
}

export const workersTools = [
  {
    name: "workers_list",
    description: "List all Workers scripts in the account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "workers_get",
    description: "Get details for a specific Worker script",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Worker script name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "workers_list_routes",
    description: "List Worker routes for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: {
          type: "string",
          description: "Zone ID",
        },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "workers_list_cron_triggers",
    description: "List cron triggers for a Worker",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Worker script name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "workers_get_logs",
    description: "Get recent logs/invocations for a Worker (requires logpush enabled)",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Worker script name",
        },
        limit: {
          type: "number",
          description: "Maximum number of logs to return (default: 100)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "workers_tail_start",
    description: "Start a tail session to stream Worker logs in real-time. Returns a WebSocket URL for connecting.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Worker script name",
        },
      },
      required: ["name"],
    },
  },
] as const;

export async function handleWorkersTool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();
    const params = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "workers_list": {
        const workers = await cfFetch<Worker[]>(
          `/accounts/${accountId}/workers/scripts`
        );
        return jsonResult({
          workers: workers.map((w) => ({
            name: w.id,
            createdOn: w.created_on,
            modifiedOn: w.modified_on,
          })),
          total: workers.length,
        });
      }

      case "workers_get": {
        const workerName = params.name as string;
        if (!workerName) {
          return errorResult("Worker name is required");
        }

        // Get script metadata
        const script = await cfFetch<WorkerScript>(
          `/accounts/${accountId}/workers/scripts/${workerName}`
        );

        // Get settings/bindings
        let settings: unknown = null;
        try {
          settings = await cfFetch<unknown>(
            `/accounts/${accountId}/workers/scripts/${workerName}/settings`
          );
        } catch {
          // Settings may not be available
        }

        // Get subdomain
        let subdomain: string | null = null;
        try {
          const subdomainInfo = await cfFetch<{ subdomain: string }>(
            `/accounts/${accountId}/workers/subdomain`
          );
          subdomain = subdomainInfo.subdomain;
        } catch {
          // Subdomain may not be configured
        }

        return jsonResult({
          name: workerName,
          handlers: script.handlers,
          logpush: script.logpush,
          placementMode: script.placement_mode,
          tailConsumers: script.tail_consumers,
          settings,
          subdomain: subdomain ? `${workerName}.${subdomain}.workers.dev` : null,
        });
      }

      case "workers_list_routes": {
        const zoneId = params.zoneId as string;
        if (!zoneId) {
          return errorResult("Zone ID is required");
        }

        const routes = await cfFetch<Array<{
          id: string;
          pattern: string;
          script?: string;
        }>>(`/zones/${zoneId}/workers/routes`);

        return jsonResult({
          routes: routes.map((r) => ({
            id: r.id,
            pattern: r.pattern,
            script: r.script || "(no script)",
          })),
          total: routes.length,
        });
      }

      case "workers_list_cron_triggers": {
        const workerName = params.name as string;
        if (!workerName) {
          return errorResult("Worker name is required");
        }

        const schedules = await cfFetch<{
          schedules: Array<{ cron: string; created_on?: string; modified_on?: string }>;
        }>(`/accounts/${accountId}/workers/scripts/${workerName}/schedules`);

        return jsonResult({
          worker: workerName,
          schedules: schedules.schedules?.map((s) => ({
            cron: s.cron,
            createdOn: s.created_on,
            modifiedOn: s.modified_on,
          })) || [],
        });
      }

      case "workers_get_logs": {
        const workerName = params.name as string;
        if (!workerName) {
          return errorResult("Worker name is required");
        }

        // Note: Cloudflare doesn't have a direct "get recent logs" API.
        // Logs require either Logpush or real-time tail.
        // We'll return info about how to access logs.

        // Check if logpush is enabled
        let script: WorkerScript | null = null;
        try {
          script = await cfFetch<WorkerScript>(
            `/accounts/${accountId}/workers/scripts/${workerName}`
          );
        } catch {
          return errorResult(`Worker '${workerName}' not found`);
        }

        return jsonResult({
          worker: workerName,
          logpushEnabled: script.logpush ?? false,
          note: script.logpush
            ? "Logpush is enabled. Logs are being sent to your configured destination."
            : "Logpush is not enabled. Use workers_tail_start for real-time logs, or enable Logpush in the dashboard.",
          tailConsumers: script.tail_consumers || [],
          recommendations: [
            "Use workers_tail_start to get real-time logs via WebSocket",
            "Enable Logpush to send logs to R2, S3, or other destinations",
            "Check the Cloudflare dashboard for recent invocation metrics",
          ],
        });
      }

      case "workers_tail_start": {
        const workerName = params.name as string;
        if (!workerName) {
          return errorResult("Worker name is required");
        }

        // Create a tail session
        const tail = await cfFetch<{
          id: string;
          url: string;
          expires_at: string;
        }>(`/accounts/${accountId}/workers/scripts/${workerName}/tails`, {
          method: "POST",
          body: JSON.stringify({}),
        });

        return jsonResult({
          worker: workerName,
          tailId: tail.id,
          websocketUrl: tail.url,
          expiresAt: tail.expires_at,
          usage: {
            note: "Connect to the WebSocket URL to receive real-time logs",
            // eslint-disable-next-line ds/no-raw-font -- false positive: "timestamp" is not a font
            format: "Messages are JSON with: timestamp, event, logs, exceptions, outcome",
            example: {
              timestamp: 1234567890,
              outcome: "ok",
              logs: [{ level: "log", message: ["Hello, World!"], timestamp: 1234567890 }],
            },
          },
        });
      }

      default:
        return errorResult(`Unknown workers tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
