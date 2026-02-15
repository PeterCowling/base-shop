#!/usr/bin/env node

/**
 * Octorate reservations export automation.
 *
 * Prereqs:
 * - Build MCP server once: `pnpm --filter @acme/mcp-server build`
 * - Save a Playwright storage state at: `.secrets/octorate/storage-state.json`
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { handleToolCall } from "./dist/tools/index.js";
import { parseIsoToLocalDate, parseOctorateExportArgs, timeFilterToOptionLabel } from "./octorate-export-args.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_STATE = join(__dirname, ".secrets/octorate/storage-state.json");
const DOWNLOAD_DIR = join(__dirname, ".tmp/octorate-downloads");
const OCTORATE_EXPORT_URL = "https://admin.octorate.com/octobook/user/reservation/export.xhtml";

function formatDateDDMMYYYY(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

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

async function openSession() {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  const open = await tool("browser_session_open", {
    url: OCTORATE_EXPORT_URL,
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

async function selectTimeFilter(sessionId, optionLabel) {
  const first = await observe(sessionId, "document");

  const dropdown = findFirstAffordance(
    first,
    (a) => a.role === "combobox",
    "time filter dropdown (combobox)"
  );

  await clickByActionId(sessionId, first.observationId, dropdown.actionId);
  await sleep(1500);

  const menu = await observe(sessionId, "modal");
  const options = (menu.affordances ?? []).filter((a) => a.role === "option");
  const match = options
    .slice(0, 10)
    .find((a) => (a.name ?? "").trim().toLowerCase() === String(optionLabel).trim().toLowerCase());

  if (!match) {
    throw new Error(`Could not find "${optionLabel}" option in the first 10 options`);
  }

  await clickByActionId(sessionId, menu.observationId, match.actionId);
  await sleep(3000);
}

async function setDateRange(sessionId, startDate, endDate) {
  const obs = await observe(sessionId, "document");

  if (typeof obs?.page?.url !== "string" || !obs.page.url.includes("export.xhtml")) {
    throw new Error(`Unexpected page URL after selecting time filter: ${obs?.page?.url ?? "(missing)"}`);
  }

  const textboxes = (obs.affordances ?? []).filter((a) => a.role === "textbox");

  // Octorate exposes unnamed textboxes; first unnamed textbox is often a hidden dropdown input.
  const dateBoxes = textboxes.filter((a) => {
    const name = (a.name ?? "").trim().toLowerCase();
    if (name && name.length >= 3) {
      return false;
    }
    if (name.includes("search") || name.includes("reminder") || name.includes("how") || name.includes("type")) {
      return false;
    }
    return a.constraints?.type !== "email";
  });

  if (dateBoxes.length < 3) {
    throw new Error(`Not enough candidate date fields found (found ${dateBoxes.length})`);
  }

  const startField = dateBoxes[1];
  await fillByActionId(sessionId, obs.observationId, startField.actionId, formatDateDDMMYYYY(startDate));
  await sleep(1000);

  // Re-observe to avoid stale actionIds.
  const obs2 = await observe(sessionId, "document");
  const textboxes2 = (obs2.affordances ?? []).filter((a) => a.role === "textbox");
  const dateBoxes2 = textboxes2.filter((a) => {
    const name = (a.name ?? "").trim().toLowerCase();
    if (name && name.length >= 3) {
      return false;
    }
    if (name.includes("search") || name.includes("reminder") || name.includes("how") || name.includes("type")) {
      return false;
    }
    return a.constraints?.type !== "email";
  });

  if (dateBoxes2.length < 3) {
    throw new Error(`Not enough candidate date fields found after re-observe (found ${dateBoxes2.length})`);
  }

  const endField = dateBoxes2[2];
  await fillByActionId(sessionId, obs2.observationId, endField.actionId, formatDateDDMMYYYY(endDate));
  await sleep(1000);
}

async function clickExportAndWaitForDownload(sessionId) {
  const obs = await observe(sessionId, "document");

  const saveAsExcel = findFirstAffordance(
    obs,
    (a) => {
      if (a.role !== "button") {
        return false;
      }
      const name = (a.name ?? "").toLowerCase();
      return name.includes("save") && name.includes("excel") && !name.includes("google");
    },
    '"Save as Excel" button'
  );

  await clickByActionId(sessionId, obs.observationId, saveAsExcel.actionId);

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

async function main() {
  console.info("Octorate Reservations Export");
  console.info("===========================\n");

  await ensureSessionFile();

  const parsed = parseOctorateExportArgs(process.argv.slice(2), new Date());
  const timeFilterLabel = timeFilterToOptionLabel(parsed.timeFilter);

  const startDate = parseIsoToLocalDate(parsed.startIso);
  const endDate = parseIsoToLocalDate(parsed.endIso);

  console.info(`Time filter: ${timeFilterLabel}`);
  console.info(`Date range: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}\n`);

  let sessionId;

  try {
    sessionId = await openSession();
    console.info(`Session opened: ${sessionId}\n`);

    // Give JSF/PrimeFaces time to hydrate before first observe.
    await sleep(3000);

    console.info(`Selecting time filter: "${timeFilterLabel}"...`);
    await selectTimeFilter(sessionId, timeFilterLabel);

    console.info("Setting date range...");
    await setDateRange(sessionId, startDate, endDate);

    console.info("Exporting (Save as Excel)...");
    const download = await clickExportAndWaitForDownload(sessionId);

    if (!download) {
      throw new Error("No download detected within timeout");
    }

    await verifyDownloadedFile(download);

    console.info("\nExport complete\n");
    console.info(`Filename: ${download.filename}`);
    console.info(`Path: ${download.path}`);
    console.info(`Size: ${(download.size / 1024).toFixed(2)} KB`);
    console.info(`Time filter: ${timeFilterLabel}`);
    console.info(`Date range: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}`);
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
