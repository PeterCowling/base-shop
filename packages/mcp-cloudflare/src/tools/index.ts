import { errorResult } from "../utils/validation.js";

import { analyticsTools, handleAnalyticsTool } from "./analytics.js";
import { auditTools, handleAuditTool } from "./audit.js";
import { cacheTools, handleCacheTool } from "./cache.js";
import { d1Tools, handleD1Tool } from "./d1.js";
import { dnsTools, handleDnsTool } from "./dns.js";
import { handleHealthTool,healthTools } from "./health.js";
import { handleKVTool,kvTools } from "./kv.js";
import { handlePagesTool,pagesTools } from "./pages.js";
import { handleR2Tool,r2Tools } from "./r2.js";
import { handleSecurityTool,securityTools } from "./security.js";
import { handleWorkersTool,workersTools } from "./workers.js";

export const toolDefinitions = [
  ...pagesTools,
  ...dnsTools,
  ...r2Tools,
  ...kvTools,
  ...analyticsTools,
  ...auditTools,
  ...cacheTools,
  ...securityTools,
  ...healthTools,
  ...workersTools,
  ...d1Tools,
];

const pagesToolNames = new Set(pagesTools.map((t) => t.name));
const dnsToolNames = new Set(dnsTools.map((t) => t.name));
const r2ToolNames = new Set(r2Tools.map((t) => t.name));
const kvToolNames = new Set(kvTools.map((t) => t.name));
const analyticsToolNames = new Set(analyticsTools.map((t) => t.name));
const auditToolNames = new Set(auditTools.map((t) => t.name));
const cacheToolNames = new Set(cacheTools.map((t) => t.name));
const securityToolNames = new Set(securityTools.map((t) => t.name));
const healthToolNames = new Set(healthTools.map((t) => t.name));
const workersToolNames = new Set(workersTools.map((t) => t.name));
const d1ToolNames = new Set(d1Tools.map((t) => t.name));

export async function handleToolCall(name: string, args: unknown) {
  if (pagesToolNames.has(name as never)) {
    return handlePagesTool(name, args);
  }
  if (dnsToolNames.has(name as never)) {
    return handleDnsTool(name, args);
  }
  if (r2ToolNames.has(name as never)) {
    return handleR2Tool(name, args);
  }
  if (kvToolNames.has(name as never)) {
    return handleKVTool(name, args);
  }
  if (analyticsToolNames.has(name as never)) {
    return handleAnalyticsTool(name, args);
  }
  if (auditToolNames.has(name as never)) {
    return handleAuditTool(name, args);
  }
  if (cacheToolNames.has(name as never)) {
    return handleCacheTool(name, args);
  }
  if (securityToolNames.has(name as never)) {
    return handleSecurityTool(name, args);
  }
  if (healthToolNames.has(name as never)) {
    return handleHealthTool(name, args);
  }
  if (workersToolNames.has(name as never)) {
    return handleWorkersTool(name, args);
  }
  if (d1ToolNames.has(name as never)) {
    return handleD1Tool(name, args);
  }
  return errorResult(`Unknown tool: ${name}`);
}
