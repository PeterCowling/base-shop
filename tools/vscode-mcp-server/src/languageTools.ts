import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getDiagnostics } from "./vscodeDiagnostics.js";
import {
  getDefinition,
  getHover,
  getReferences,
  getTypeDefinition,
} from "./vscodeLanguage.js";
import { getDocumentSymbols, getWorkspaceSymbols } from "./vscodeSymbols.js";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function result(data: Record<string, unknown>): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

function errorResult(message: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    structuredContent: { error: message },
    isError: true,
  };
}

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function expectPosition(value: unknown) {
  const obj = expectObject(value, "position");
  const line = obj.line;
  const character = obj.character;

  if (typeof line !== "number" || typeof character !== "number") {
    throw new Error("position.line and position.character must be numbers.");
  }

  return { line, character };
}

const toolDefinitions = [
  {
    name: "vscodeDiagnostics",
    description:
      "Return TypeScript diagnostics for a file (TS-only source, Error/Warning only).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: {
          type: "string",
          description:
            "File URI or workspace-relative path to the file to inspect.",
        },
      },
      required: ["uri"],
    },
  },
  {
    name: "vscodeHover",
    description: "Return hover/type info at a position.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: {
          type: "string",
          description: "File URI or workspace-relative path.",
        },
        position: {
          type: "object",
          additionalProperties: false,
          properties: {
            line: { type: "number" },
            character: { type: "number" },
          },
          required: ["line", "character"],
        },
      },
      required: ["uri", "position"],
    },
  },
  {
    name: "vscodeDefinition",
    description: "Return definition locations at a position.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: { type: "string" },
        position: {
          type: "object",
          additionalProperties: false,
          properties: {
            line: { type: "number" },
            character: { type: "number" },
          },
          required: ["line", "character"],
        },
      },
      required: ["uri", "position"],
    },
  },
  {
    name: "vscodeTypeDefinition",
    description: "Return type definition locations at a position.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: { type: "string" },
        position: {
          type: "object",
          additionalProperties: false,
          properties: {
            line: { type: "number" },
            character: { type: "number" },
          },
          required: ["line", "character"],
        },
      },
      required: ["uri", "position"],
    },
  },
  {
    name: "vscodeReferences",
    description: "Return reference locations at a position.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: { type: "string" },
        position: {
          type: "object",
          additionalProperties: false,
          properties: {
            line: { type: "number" },
            character: { type: "number" },
          },
          required: ["line", "character"],
        },
        includeDeclaration: {
          type: "boolean",
          description: "Include declaration in results (default false).",
        },
      },
      required: ["uri", "position"],
    },
  },
  {
    name: "vscodeDocumentSymbols",
    description: "Return document symbols for a file.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        uri: { type: "string" },
      },
      required: ["uri"],
    },
  },
  {
    name: "vscodeWorkspaceSymbols",
    description: "Return workspace symbols for a query string.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string" },
        maxResults: { type: "number" },
      },
      required: ["query"],
    },
  },
];

async function handleToolCall(name: string, args: unknown): Promise<ToolResult> {
  try {
    const input = expectObject(args ?? {}, "args");

    switch (name) {
      case "vscodeDiagnostics": {
        const uri = expectString(input.uri, "uri");
        return result(await getDiagnostics({ uri }));
      }
      case "vscodeHover": {
        const uri = expectString(input.uri, "uri");
        const position = expectPosition(input.position);
        return result(await getHover({ uri, position }));
      }
      case "vscodeDefinition": {
        const uri = expectString(input.uri, "uri");
        const position = expectPosition(input.position);
        return result(await getDefinition({ uri, position }));
      }
      case "vscodeTypeDefinition": {
        const uri = expectString(input.uri, "uri");
        const position = expectPosition(input.position);
        return result(await getTypeDefinition({ uri, position }));
      }
      case "vscodeReferences": {
        const uri = expectString(input.uri, "uri");
        const position = expectPosition(input.position);
        const includeDeclaration =
          typeof input.includeDeclaration === "boolean"
            ? input.includeDeclaration
            : undefined;
        return result(
          await getReferences({ uri, position, includeDeclaration })
        );
      }
      case "vscodeDocumentSymbols": {
        const uri = expectString(input.uri, "uri");
        return result(await getDocumentSymbols({ uri }));
      }
      case "vscodeWorkspaceSymbols": {
        const query = expectString(input.query, "query");
        const maxResults =
          typeof input.maxResults === "number" ? input.maxResults : undefined;
        return result(await getWorkspaceSymbols({ query, maxResults }));
      }
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected tool error.";
    return errorResult(message);
  }
}

export function createLanguageServer(): Server {
  const server = new Server(
    {
      name: "vscode-language-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
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

  server.onerror = (error) => {
    console.error("[vscode-mcp-server]", error);
  };

  return server;
}
