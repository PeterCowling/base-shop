// apps/telemetry-worker/src/index.ts

import { handlePost, handleGet, handleHealth } from "./endpoints";
import { handleScheduled } from "./scheduled";
import { getCorsHeaders } from "./cors";

export interface Env {
  DB: D1Database;
  TELEMETRY_ALLOWED_ORIGINS?: string;
  RETENTION_DAYS?: string;
  TELEMETRY_AUTH_TOKEN?: string;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (request.method === "GET" && url.pathname === "/health") {
      return handleHealth();
    }

    // POST /v1/telemetry - ingest events
    if (request.method === "POST" && url.pathname === "/v1/telemetry") {
      return handlePost(request, env);
    }

    // GET /v1/telemetry - query events
    if (request.method === "GET" && url.pathname === "/v1/telemetry") {
      return handleGet(request, env);
    }

    // OPTIONS for CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(env);
  },
};

export default worker;
