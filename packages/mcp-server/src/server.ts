import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  briketteResourceDefinitions,
  handleBriketteResourceRead,
} from "./resources/brikette-knowledge.js";
import { draftGuideResourceDefinition, handleDraftGuideRead } from "./resources/draft-guide.js";
import { handleResourceRead, resourceDefinitions } from "./resources/schema.js";
import { handleToolCall, toolDefinitions } from "./tools/index.js";

// Combine all resource definitions
const allResourceDefinitions = [...resourceDefinitions, ...briketteResourceDefinitions, draftGuideResourceDefinition];

export const server = new Server(
  {
    name: "base-shop-mcp",
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
  resources: allResourceDefinitions,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Route to appropriate handler based on URI scheme
  if (uri === draftGuideResourceDefinition.uri) {
    return handleDraftGuideRead();
  }

  if (uri.startsWith("brikette://")) {
    return handleBriketteResourceRead(uri);
  }

  // Default to schema handler
  return handleResourceRead(uri);
});

server.onerror = (error) => {
  console.error("[MCP Error]", error);
};
