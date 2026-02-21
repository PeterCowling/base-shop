#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { handleToolCall } from "./dist/tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_STATE = join(__dirname, ".secrets/octorate/storage-state.json");
const DOWNLOAD_DIR = join(__dirname, ".tmp/octorate-downloads");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseToolJson = (result) => JSON.parse(result?.content?.[0]?.text);
const tool = async (name, args) => parseToolJson(await handleToolCall(name, args));

async function main() {
  console.info("Test: Direct navigation to export URL");

  const open = await tool("browser_session_open", {
    url: "https://admin.octorate.com/octobook/user/reservation/export.xhtml",
    headless: false,
    slowMoMs: 800,
    storageStatePath: STORAGE_STATE,
    downloadDir: DOWNLOAD_DIR,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  console.info(`Session: ${sessionId}`);

  console.info("\nWaiting 10 seconds for page to fully load...");
  await sleep(10000);

  const obs = await tool("browser_observe", {
    sessionId,
    mode: "a11y",
    scope: "document",
    maxAffordances: 50
  });

  console.info(`\nFinal URL: ${obs.page.url}`);
  console.info(obs.page.url.includes('export') ? "✅ ON EXPORT PAGE" : "❌ REDIRECTED");

  console.info("\nPage title:", obs.page.title);

  await tool("browser_session_close", { sessionId }).catch(() => {});
}

main().catch(console.error);
