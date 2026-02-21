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
    // Debug: What calendar links exist?
    const result = await tool("browser_act", {
      sessionId,
      observationId: null,
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          const allLinks = Array.from(document.querySelectorAll('a'));
          const calendarLinks = allLinks.filter(a =>
            a.textContent.toLowerCase().includes('calendar')
          );

          calendarLinks.map((link, i) => ({
            index: i,
            text: link.textContent.trim(),
            href: link.href,
            visible: link.offsetParent !== null,
            classes: link.className,
            id: link.id
          }));
        `
      }
    });

    console.info("Calendar links found:");
    console.info(JSON.stringify(result, null, 2));

    // Try clicking the first visible one
    console.info("\n\nTrying to click first visible Calendar link...");
    const result2 = await tool("browser_act", {
      sessionId,
      observationId: null,
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          const links = Array.from(document.querySelectorAll('a')).filter(a =>
            a.textContent.toLowerCase().includes('calendar') &&
            a.offsetParent !== null
          );
          if (!links.length) throw new Error("No visible calendar links");

          const link = links[0];
          const info = {
            text: link.textContent.trim(),
            href: link.href,
            willNavigate: link.href && !link.href.includes('#')
          };

          link.click();

          info;
        `
      }
    });

    console.info("Click result:", JSON.stringify(result2, null, 2));

    await sleep(4000);

    // Check current URL
    const obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 10
    });

    console.info(`\nCurrent URL: ${obs.page.url}`);
    console.info(obs.page.url.includes('calendar') ? "✅ ON CALENDAR PAGE" : "❌ STILL ON DASHBOARD");

  } finally {
    await tool("browser_session_close", { sessionId }).catch(() => {});
  }
}

main().catch(console.error);
