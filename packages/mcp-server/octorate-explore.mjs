#!/usr/bin/env node

/**
 * Interactive Octorate page explorer - quickly test navigation and element selection
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { handleToolCall } from "./dist/tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_STATE = join(__dirname, ".secrets/octorate/storage-state.json");
const DOWNLOAD_DIR = join(__dirname, ".tmp/octorate-downloads");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseToolJson(toolResult) {
  const first = toolResult?.content?.[0]?.text;
  if (typeof first !== "string" || !first.trim()) {
    throw new Error("Unexpected tool response shape");
  }
  return JSON.parse(first);
}

async function tool(name, args) {
  const result = await handleToolCall(name, args);
  return parseToolJson(result);
}

async function dumpAffordances(obs, filter = null) {
  const affordances = obs?.affordances ?? [];

  console.info(`\n=== PAGE: ${obs?.page?.url ?? "(unknown)"} ===`);
  console.info(`Total affordances: ${affordances.length}\n`);

  const filtered = filter ? affordances.filter(filter) : affordances;

  filtered.forEach((a, i) => {
    console.info(`[${i + 1}] actionId=${a.actionId}`);
    console.info(`    role: ${a.role}`);
    console.info(`    name: "${a.name ?? '(empty)'}"`);
    if (a.value) console.info(`    value: "${a.value}"`);
    if (a.description) console.info(`    description: "${a.description}"`);
    console.info("");
  });
}

async function main() {
  console.info("Octorate Page Explorer");
  console.info("=====================\n");

  // Open session
  const open = await tool("browser_session_open", {
    url: "https://admin.octorate.com/octobook/user/dashboard/index.xhtml",
    headless: false,
    slowMoMs: 800,
    storageStatePath: STORAGE_STATE,
    downloadDir: DOWNLOAD_DIR,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  console.info(`Session opened: ${sessionId}\n`);
  console.info("Waiting for dashboard to load...\n");
  await sleep(3000);

  try {
    // Step 1: Dashboard - show menu items
    console.info("\n### STEP 1: DASHBOARD - Show menu items ###");
    let obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 200,
    });
    dumpAffordances(obs, (a) => a.role === "menuitem" || a.role === "link");

    // Click Calendar
    console.info("\nClicking 'Calendar' menu item...");
    const calendarLink = obs.affordances.find((a) =>
      (a.role === "menuitem" || a.role === "link") &&
      (a.name ?? "").toLowerCase().includes("calendar")
    );
    if (!calendarLink) throw new Error("Calendar menu not found");

    await tool("browser_act", {
      sessionId,
      observationId: obs.observationId,
      target: { kind: "element", actionId: calendarLink.actionId },
      action: { type: "click" },
    });
    await sleep(2000);

    // Step 2: After Calendar click - show submenus
    console.info("\n### STEP 2: AFTER CALENDAR CLICK - Show submenus ###");
    obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 200,
    });
    dumpAffordances(obs, (a) => a.role === "menuitem" || a.role === "link");

    // Click Standard View
    console.info("\nClicking 'Standard View'...");
    const standardView = obs.affordances.find((a) =>
      (a.role === "menuitem" || a.role === "link") &&
      (a.name ?? "").toLowerCase().includes("standard") &&
      (a.name ?? "").toLowerCase().includes("view")
    );
    if (!standardView) throw new Error("Standard View not found");

    await tool("browser_act", {
      sessionId,
      observationId: obs.observationId,
      target: { kind: "element", actionId: standardView.actionId },
      action: { type: "click" },
    });
    await sleep(4000);

    // Step 3: Calendar page - show all buttons
    console.info("\n### STEP 3: CALENDAR PAGE - Show all buttons ###");
    obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 200,
    });
    dumpAffordances(obs, (a) => a.role === "button");

    // Try clicking the "..." button via JavaScript
    console.info("\nTrying to click '...' button via JavaScript...");
    await tool("browser_act", {
      sessionId,
      observationId: null,
      target: { kind: "page" },
      action: {
        type: "evaluate",
        expression: `
          const button = document.querySelector('button[id^="formDays:j_idt"][id$="_button"]');
          console.info("Found button:", button);
          if (button) {
            button.click();
            'Clicked menu button: ' + button.id;
          } else {
            throw new Error("Menu button not found");
          }
        `
      }
    });
    await sleep(2000);

    // Step 4: After menu click - show all links and menuitems
    console.info("\n### STEP 4: AFTER MENU CLICK - Show links/menuitems ###");
    obs = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 200,
    });
    console.info("\nAll menuitems and links:");
    dumpAffordances(obs, (a) => a.role === "menuitem" || a.role === "link");

    // Try modal scope
    console.info("\n### STEP 4b: MODAL SCOPE ###");
    const obsModal = await tool("browser_observe", {
      sessionId,
      mode: "a11y",
      scope: "modal",
      maxAffordances: 200,
    });
    dumpAffordances(obsModal, (a) => a.role === "menuitem" || a.role === "link");

    console.info("\n\n=== SESSION LEFT OPEN FOR MANUAL INSPECTION ===");
    console.info("Press Ctrl+C when done");

    // Keep alive
    await new Promise(() => {});

  } catch (error) {
    console.error("\nError:", error.message);
    await tool("browser_session_close", { sessionId }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
