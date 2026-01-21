import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { handleResourceRead,resourceDefinitions } from "./resources/account.js";
import { handleToolCall,toolDefinitions } from "./tools/index.js";

export const server = new Server(
  {
    name: "cloudflare-mcp",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args);
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resourceDefinitions,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return handleResourceRead(uri);
});

server.onerror = (error) => {
  console.error("[Cloudflare MCP Error]", error);
};
