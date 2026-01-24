import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import * as vscode from "vscode";

import { createLanguageServer } from "./languageTools.js";

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createLanguageServer>;
};

const MAX_BODY_BYTES = 2 * 1024 * 1024;

let httpServer: HttpServer | undefined;
let portFilePath: string | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
const sessions = new Map<string, SessionEntry>();

function log(message: string) {
  outputChannel?.appendLine(message);
}

function getWorkspaceRoot(): vscode.Uri | undefined {
  const [folder] = vscode.workspace.workspaceFolders ?? [];
  return folder?.uri;
}

async function writePortFile(port: number) {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const vscodeDir = vscode.Uri.joinPath(workspaceRoot, ".vscode");
  await fs.mkdir(vscodeDir.fsPath, { recursive: true });

  const portPath = vscode.Uri.joinPath(vscodeDir, ".mcp-port").fsPath;
  await fs.writeFile(portPath, String(port), "utf8");
  portFilePath = portPath;
}

async function removePortFile() {
  if (!portFilePath) {
    return;
  }
  try {
    await fs.unlink(portFilePath);
  } catch {
    // Ignore missing sentinel file.
  }
  portFilePath = undefined;
}

function getSessionId(req: IncomingMessage): string | undefined {
  const header = req.headers["mcp-session-id"];
  if (Array.isArray(header)) {
    return header[0];
  }
  if (typeof header === "string") {
    return header;
  }
  return undefined;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("Request body too large.");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return text.trim() ? JSON.parse(text) : undefined;
}

function sendJsonError(res: ServerResponse, status: number, message: string) {
  if (res.headersSent) {
    res.end();
    return;
  }

  const payload = JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message,
    },
    id: null,
  });

  res.writeHead(status, {
    "Content-Type": "application/json",
  });
  res.end(payload);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== "/mcp") {
    res.writeHead(404).end();
    return;
  }

  const sessionId = getSessionId(req);
  const method = req.method ?? "GET";

  try {
    if (method === "POST") {
      const body = await readJsonBody(req);

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        await session?.transport.handleRequest(req, res, body);
        return;
      }

      if (!sessionId && body && isInitializeRequest(body)) {
        const server = createLanguageServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, { transport, server });
            log(`MCP session initialized: ${id}`);
          },
          onsessionclosed: (id) => {
            sessions.delete(id);
          },
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }

      sendJsonError(res, 400, "Bad Request: missing or invalid session.");
      return;
    }

    if (method === "GET" || method === "DELETE") {
      if (!sessionId || !sessions.has(sessionId)) {
        sendJsonError(res, 404, "Unknown session.");
        return;
      }

      const session = sessions.get(sessionId);
      await session?.transport.handleRequest(req, res);
      return;
    }

    sendJsonError(res, 405, "Method not allowed.");
  } catch (error) {
    console.error("[vscode-mcp-server] request error", error);
    const message =
      error instanceof SyntaxError
        ? "Invalid JSON body."
        : error instanceof Error && error.message === "Request body too large."
          ? "Request body too large."
          : "Internal server error.";
    const status =
      error instanceof SyntaxError
        ? 400
        : error instanceof Error && error.message === "Request body too large."
          ? 413
          : 500;
    sendJsonError(res, status, message);
  }
}

async function startServer(): Promise<number | undefined> {
  if (httpServer) {
    return undefined;
  }

  if (!getWorkspaceRoot()) {
    log("No workspace folder detected; MCP server not started.");
    return undefined;
  }

  httpServer = createServer((req, res) => {
    void handleRequest(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    httpServer?.once("error", (error) => reject(error));
    httpServer?.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind MCP HTTP server.");
  }

  await writePortFile(address.port);
  log(`MCP server listening on http://127.0.0.1:${address.port}/mcp`);
  return address.port;
}

async function stopServer() {
  for (const [sessionId, entry] of sessions.entries()) {
    sessions.delete(sessionId);
    await entry.transport.close();
  }

  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve());
    });
    httpServer = undefined;
  }

  await removePortFile();
  log("MCP server stopped.");
}

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("MCP Language Server");
  context.subscriptions.push(outputChannel);
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "MCP TS: starting…";
  statusBarItem.tooltip = "VS Code MCP TypeScript language server";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const port = await startServer();
  if (typeof port === "number") {
    statusBarItem.text = `MCP TS: ${port}`;
    statusBarItem.tooltip = `http://127.0.0.1:${port}/mcp`;
  } else {
    statusBarItem.text = "MCP TS: offline";
  }

  context.subscriptions.push({
    dispose: () => {
      void stopServer();
    },
  });
}

export async function deactivate() {
  await stopServer();
}
