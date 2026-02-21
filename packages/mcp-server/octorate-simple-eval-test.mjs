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
  console.info("Opening session...");
  const open = await tool("browser_session_open", {
    url: "https://admin.octorate.com/octobook/user/dashboard/index.xhtml",
    headless: false,
    slowMoMs: 800,
    storageStatePath: STORAGE_STATE,
    downloadDir: DOWNLOAD_DIR,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  console.info(`Session: ${sessionId}`);
  await sleep(3000);

  try {
    console.info("\nTest 1: Can we evaluate?");
    const result1 = await tool("browser_act", {
      sessionId,
      observationId: "",
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: "2 + 2"
      }
    });
    console.info("Result:", JSON.stringify(result1, null, 2));

    console.info("\nTest 2: Can we get page title?");
    const result2 = await tool("browser_act", {
      sessionId,
      observationId: "",
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: "document.title"
      }
    });
    console.info("Result:", JSON.stringify(result2, null, 2));

    console.info("\nTest 3: Count calendar links");
    const result3 = await tool("browser_act", {
      sessionId,
      observationId: "",
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          Array.from(document.querySelectorAll('a'))
            .filter(a => a.textContent.toLowerCase().includes('calendar'))
            .length
        `
      }
    });
    console.info("Result:", JSON.stringify(result3, null, 2));

  } finally {
    await tool("browser_session_close", { sessionId }).catch(() => {});
    console.info("\nDone");
  }
}

main().catch(console.error);
