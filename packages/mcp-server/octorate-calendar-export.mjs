#!/usr/bin/env node

/**
 * Octorate calendar export automation (Batch 1).
 *
 * Navigation: Calendar → Standard View → Export (using JavaScript evaluation)
 *
 * Prereqs:
 * - Build MCP server once: `pnpm --filter @acme/mcp-server build`
 * - Save a Playwright storage state at: `.secrets/octorate/storage-state.json`
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { handleToolCall } from "./dist/tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_STATE = join(__dirname, ".secrets/octorate/storage-state.json");
const DOWNLOAD_DIR = join(__dirname, ".tmp/octorate-downloads");
const DATA_DIR = join(__dirname, "../../data/octorate");
const OCTORATE_DASHBOARD_URL = "https://admin.octorate.com/octobook/user/dashboard/index.xhtml";
const DEFAULT_START_DATE = "01/03/2025";
const DEFAULT_END_DATE = "31/10/2026";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseToolJson(toolResult) {
  const first = toolResult?.content?.[0]?.text;
  if (typeof first !== "string" || !first.trim()) {
    throw new Error("Unexpected tool response shape (missing content[0].text)");
  }
  return JSON.parse(first);
}

async function tool(name, args) {
  const result = await handleToolCall(name, args);
  return parseToolJson(result);
}

async function ensureSessionFile() {
  try {
    await fs.access(STORAGE_STATE);
  } catch {
    throw new Error(`No session found at ${STORAGE_STATE}`);
  }
}

async function ensureDirectories() {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function openSession() {
  const open = await tool("browser_session_open", {
    url: OCTORATE_DASHBOARD_URL,
    headless: false,
    slowMoMs: 800,
    storageStatePath: STORAGE_STATE,
    downloadDir: DOWNLOAD_DIR,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error("browser_session_open did not return a sessionId");
  }

  return sessionId;
}

async function navigateToExport(sessionId) {
  // Step 1: Click the "..." menu button
  console.info("Clicking menu button via JavaScript...");
  await tool("browser_act", {
    sessionId,
    observationId: "",
    target: { kind: "page" },
    action: {
      type: "evaluate",
      expression: `
        const menuButton = document.querySelector('button[id^="formDays:j_idt"][id$="_button"]');
        if (!menuButton) throw new Error("Menu button not found");
        menuButton.click();
      `
    }
  });

  await sleep(2000);

  // Step 2: Click "Export calendar to Excel" link
  console.info("Clicking Export link via JavaScript...");
  await tool("browser_act", {
    sessionId,
    observationId: "",
    target: { kind: "page" },
    action: {
      type: "evaluate",
      expression: `
        const exportLink = Array.from(document.querySelectorAll('a'))
          .find(el => {
            const text = el.textContent.toLowerCase();
            return text.includes('export') && text.includes('calendar');
          });
        if (!exportLink) throw new Error("Export link not found");
        exportLink.click();
      `
    }
  });

  await sleep(3000);
}

async function observe(sessionId, scope) {
  return await tool("browser_observe", {
    sessionId,
    mode: "a11y",
    scope,
    maxAffordances: 200,
  });
}

function findFirstAffordance(observation, predicate, label) {
  const found = observation?.affordances?.find(predicate);
  if (!found) {
    throw new Error(`Could not find ${label}`);
  }
  return found;
}

async function clickByActionId(sessionId, observationId, actionId) {
  await tool("browser_act", {
    sessionId,
    observationId,
    target: { kind: "element", actionId },
    action: { type: "click" },
  });
}

async function fillByActionId(sessionId, observationId, actionId, value) {
  await tool("browser_act", {
    sessionId,
    observationId,
    target: { kind: "element", actionId },
    action: { type: "fill", value },
  });
}

async function setDateRange(sessionId, startDate, endDate) {
  const obs = await observe(sessionId, "document");

  // Verify we're on the export page
  if (typeof obs?.page?.url !== "string" || !obs.page.url.includes("export.xhtml")) {
    throw new Error(`Unexpected page URL: ${obs?.page?.url ?? "(missing)"}`);
  }

  // Find date input fields (role: textbox with date format values)
  const textboxes = (obs.affordances ?? []).filter((a) => a.role === "textbox");

  // Find start date field (should have value like "01/03/2025")
  const startField = textboxes.find((a) => {
    const val = a.value ?? "";
    return val.match(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  if (!startField) {
    throw new Error("Could not find start date field");
  }

  console.info(`Setting start date: ${startDate}`);
  await fillByActionId(sessionId, obs.observationId, startField.actionId, startDate);
  await sleep(1000);

  // Re-observe to get fresh affordances
  const obs2 = await observe(sessionId, "document");
  const textboxes2 = (obs2.affordances ?? []).filter((a) => a.role === "textbox");

  // Find end date field (second date field)
  const dateFields = textboxes2.filter((a) => {
    const val = a.value ?? "";
    return val.match(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  if (dateFields.length < 2) {
    throw new Error("Could not find end date field");
  }

  const endField = dateFields[1];
  console.info(`Setting end date: ${endDate}`);
  await fillByActionId(sessionId, obs2.observationId, endField.actionId, endDate);
  await sleep(1000);
}

async function clickExportAndWaitForDownload(sessionId) {
  const obs = await observe(sessionId, "document");

  // Find "Save as Excel" button (has fa-file-excel-o icon)
  const saveButton = findFirstAffordance(
    obs,
    (a) => {
      if (a.role !== "button") return false;
      const name = (a.name ?? "").toLowerCase();
      return name.includes("save") && name.includes("excel");
    },
    '"Save as Excel" button'
  );

  console.info("Clicking Save as Excel...");
  await clickByActionId(sessionId, obs.observationId, saveButton.actionId);

  const result = await tool("browser_wait_for_download", {
    sessionId,
    timeoutMs: 60_000,
  });

  return result.download ?? null;
}

async function verifyDownloadedFile(download) {
  if (!download?.path) {
    throw new Error("Download missing path");
  }

  const stats = await fs.stat(download.path);
  if (stats.size <= 0) {
    throw new Error("Downloaded file is empty");
  }
}

async function moveToDataDir(download) {
  const today = new Date().toISOString().split("T")[0];
  const destFilename = `octorate-calendar-${today}.xlsx`;
  const destPath = join(DATA_DIR, destFilename);

  await fs.copyFile(download.path, destPath);

  return { destPath, destFilename };
}

async function main() {
  console.info("Octorate Calendar Export (Batch 1)");
  console.info("==================================\n");

  await ensureSessionFile();
  await ensureDirectories();

  const startDate = process.env.OCTORATE_START_DATE || DEFAULT_START_DATE;
  const endDate = process.env.OCTORATE_END_DATE || DEFAULT_END_DATE;

  console.info(`Date range: ${startDate} to ${endDate}\n`);

  let sessionId;

  try {
    sessionId = await openSession();
    console.info(`Session opened: ${sessionId}\n`);

    console.info("Waiting for calendar page to load...");
    await sleep(5000);

    // Check where we actually landed
    const checkObs = await observe(sessionId, "document");
    console.info(`Current URL: ${checkObs.page.url}`);
    if (!checkObs.page.url.includes("calendar")) {
      throw new Error(`Redirected away from calendar to: ${checkObs.page.url}`);
    }

    console.info("Opening Export menu...");
    await navigateToExport(sessionId);

    console.info("Setting date range...");
    await setDateRange(sessionId, startDate, endDate);

    console.info("Exporting (Save as Excel)...");
    const download = await clickExportAndWaitForDownload(sessionId);

    if (!download) {
      throw new Error("No download detected within timeout");
    }

    await verifyDownloadedFile(download);

    console.info("\nMoving file to data directory...");
    const { destPath, destFilename } = await moveToDataDir(download);

    console.info("\nExport complete\n");
    console.info(`Filename: ${destFilename}`);
    console.info(`Path: ${destPath}`);
    console.info(`Size: ${(download.size / 1024).toFixed(2)} KB`);
    console.info(`Date range: ${startDate} to ${endDate}`);
  } finally {
    if (sessionId) {
      await tool("browser_session_close", { sessionId }).catch(() => {});
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
