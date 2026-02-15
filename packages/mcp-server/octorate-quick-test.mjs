#!/usr/bin/env node

import { promises as fs } from "node:fs";
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
  console.info(`Session: ${sessionId}`);
  await sleep(3000);

  try {
    // Try clicking the LINK version of Calendar (a_26) not menuitem (a_7)
    console.info("\nTest 1: Click Calendar LINK (a_26)");
    let obs = await tool("browser_observe", { sessionId, mode: "a11y", scope: "document", maxAffordances: 200 });

    const calendarLink = obs.affordances.find(a =>
      a.role === "link" && (a.name ?? "").toLowerCase().includes("calendar")
    );
    console.info(`Found Calendar link: ${calendarLink?.actionId} name="${calendarLink?.name}"`);

    await tool("browser_act", {
      sessionId,
      observationId: obs.observationId,
      target: { kind: "element", actionId: calendarLink.actionId },
      action: { type: "click" }
    });

    await sleep(4000);

    obs = await tool("browser_observe", { sessionId, mode: "a11y", scope: "document", maxAffordances: 200 });
    console.info(`After click - URL: ${obs.page.url}`);

    if (obs.page.url.includes("calendar")) {
      console.info("\n✅ SUCCESS - We're on the calendar page!");

      // Now try to find the export button
      console.info("\nLooking for buttons...");
      const buttons = obs.affordances.filter(a => a.role === "button");
      buttons.forEach(b => console.info(`  Button: "${b.name}" (${b.actionId})`));

      const menuButton = buttons.find(b => {
        const name = (b.name ?? "").trim();
        return name === "..." || name === "…" || name.length <= 3;
      });

      if (menuButton) {
        console.info(`\n✅ Found menu button: "${menuButton.name}" (${menuButton.actionId})`);
      } else {
        console.info("\n❌ Menu button not found via affordances");
        console.info("Trying JavaScript selector...");

        const jsResult = await tool("browser_act", {
          sessionId,
          observationId: null,
          target: { kind: "page" },
          action: {
            type: "evaluate",
            expression: `
              const btn = document.querySelector('button[id^="formDays:j_idt"][id$="_button"]');
              btn ? ('Found: ' + btn.id + ' text="' + btn.textContent + '"') : 'Not found';
            `
          }
        });
        console.info(`JavaScript result: ${JSON.stringify(jsResult)}`);
      }
    } else {
      console.info("❌ FAILED - Still on:", obs.page.url);
    }

  } finally {
    console.info("\nClosing...");
    await tool("browser_session_close", { sessionId }).catch(() => {});
  }
}

main().catch(console.error);
