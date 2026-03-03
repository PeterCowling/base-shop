#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { server } from "./server.js";

// Prevent Node from exiting when Claude Code closes the stdin pipe (session idle /
// context compaction). Without this, the StdioServerTransport's 'data' listener is
// the only thing keeping the event loop alive — when the parent closes stdin (EOF),
// the loop drains and the process exits silently, causing "Tool not found" errors on
// the next user turn.
process.stdin.resume();

// Gracefully log and exit when Claude Code closes the pipe (EOF).
process.stdin.once("end", () => {
  console.error("[MCP] stdin closed — parent disconnected. Exiting.");
  process.exit(0);
});

// Claude Code sends SIGTERM before killing the subprocess.
process.on("SIGTERM", () => {
  console.error("[MCP] SIGTERM received. Exiting.");
  process.exit(0);
});

// Catch unhandled promise rejections — log but don't exit so a single failing tool
// call doesn't bring down the whole server.
process.on("unhandledRejection", (reason) => {
  console.error("[MCP] Unhandled rejection:", reason);
});

// Catch truly unexpected exceptions — log and exit so Claude Code can respawn.
process.on("uncaughtException", (error) => {
  console.error("[MCP] Uncaught exception:", error);
  process.exit(1);
});

// Validate required environment variables at startup
const _firebaseUrl = process.env.FIREBASE_DATABASE_URL;
if (!_firebaseUrl) {
  process.stderr.write(
    "[MCP Server] WARNING: FIREBASE_DATABASE_URL is not set — cancellation and activity writes will fail silently\n"
  );
} else if (!_firebaseUrl.startsWith("https://")) {
  process.stderr.write(
    "[MCP Server] WARNING: FIREBASE_DATABASE_URL does not start with https:// — check the format\n"
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("base-shop MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
