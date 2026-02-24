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
  const open = await tool("browser_session_open", {
    url: "https://admin.octorate.com/octobook/user/dashboard/index.xhtml",
    headless: false,
    slowMoMs: 800,
    storageStatePath: STORAGE_STATE,
    downloadDir: DOWNLOAD_DIR,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  console.info(`Session: ${sessionId}\n`);
  await sleep(3000);

  try {
    // Test: Find all calendar links and their properties
    console.info("=== Finding Calendar links ===");
    await tool("browser_act", {
      sessionId,
      observationId: "",
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          const links = Array.from(document.querySelectorAll('a')).filter(a =>
            a.textContent.toLowerCase().includes('calendar') &&
            !a.classList.contains('sidebar-pin') &&
            a.offsetParent !== null
          );
          console.info('Found', links.length, 'calendar links');
          links.forEach((link, i) => {
            console.info(i, ':', {
              text: link.textContent.trim(),
              href: link.href,
              id: link.id,
              onclick: link.onclick ? 'has onclick' : 'no onclick'
            });
          });
        `
      }
    });

    await sleep(1000);

    // Test: Try clicking and check if navigation happens
    console.info("\n=== Clicking first calendar link ===");
    await tool("browser_act", {
      sessionId,
      observationId: "",
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          const links = Array.from(document.querySelectorAll('a')).filter(a =>
            a.textContent.toLowerCase().includes('calendar') &&
            !a.classList.contains('sidebar-pin') &&
            a.offsetParent !== null
          );
          if (!links.length) throw new Error("No calendar links found");

          const link = links[0];
          console.info('About to click:', link.textContent.trim(), link.href);
          link.click();
          console.info('Clicked!');
        `
      }
    });

    await sleep(5000);

    // Check current URL
    const obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 10
    });

    console.info(`\n=== Result ===`);
    console.info(`Current URL: ${obs.page.url}`);
    console.info(obs.page.url.includes('calendar') ? "✅ ON CALENDAR" : "❌ STILL ON DASHBOARD");

  } finally {
    console.info("\n\nKeeping browser open for manual inspection...");
    console.info("Check the browser console for logs");
    console.info("Press Ctrl+C to close");
    await new Promise(() => {});
  }
}

main().catch(console.error);
