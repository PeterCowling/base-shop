/**
 * Octorate browser automation tools (interactive).
 *
 * Security model:
 * - Credentials are read from env; never hardcode credentials in-repo.
 * - MFA must be completed by a human in the opened browser window.
 * - Session storage state is written to a local gitignored file (contains cookies).
 */

import { promises as fs } from "fs";
import path from "path";
import { chromium } from "playwright-core";
import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

const DEFAULT_LOGIN_URL = "https://admin.octorate.com/";
const DEFAULT_CALENDAR_URL =
  "https://admin.octorate.com/octobook/user/calendar/index.xhtml";

const loginInteractiveSchema = z
  .object({
    timeoutSeconds: z.number().int().min(30).max(3600).optional(),
    storageStatePath: z.string().min(1).optional(),
    calendarUrl: z.string().url().optional(),
    slowMoMs: z.number().int().min(0).max(2000).optional(),
  })
  .strict();

const calendarCheckSchema = z
  .object({
    storageStatePath: z.string().min(1).optional(),
    calendarUrl: z.string().url().optional(),
  })
  .strict();

type OctorateEnv = {
  username: string;
  password: string;
  chromeExecutablePath?: string;
};

function readOctorateEnv(): OctorateEnv | { error: string } {
  const username = process.env.OCTORATE_USERNAME?.trim() || "";
  const password = process.env.OCTORATE_PASSWORD?.trim() || "";

  if (!username) {
    return { error: "Missing env var: OCTORATE_USERNAME" };
  }

  if (!password) {
    return { error: "Missing env var: OCTORATE_PASSWORD" };
  }

  const chromeExecutablePath = process.env.OCTORATE_CHROME_EXECUTABLE?.trim();

  return {
    username,
    password,
    chromeExecutablePath: chromeExecutablePath || undefined,
  };
}

function defaultStorageStatePath(): string {
  const override = process.env.OCTORATE_STORAGE_STATE_PATH?.trim();
  if (override) {
    return override;
  }
  return path.join(process.cwd(), ".secrets", "octorate", "storage-state.json");
}

async function ensureParentDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveChromeExecutablePath(explicit?: string): Promise<string | null> {
  const candidates = [
    explicit,
    // macOS default
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    // linux common
    process.platform === "linux" ? "/usr/bin/google-chrome" : undefined,
    process.platform === "linux" ? "/usr/bin/google-chrome-stable" : undefined,
    process.platform === "linux" ? "/usr/bin/chromium" : undefined,
    process.platform === "linux" ? "/usr/bin/chromium-browser" : undefined,
    // windows common
    process.platform === "win32"
      ? "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe"
      : undefined,
    process.platform === "win32"
      ? "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe"
      : undefined,
  ].filter((v): v is string => Boolean(v && v.trim()));

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export const octorateTools = [
  {
    name: "octorate_login_interactive",
    description:
      "Launch a local Chrome window, login to Octorate, wait for you to complete email MFA in the browser, then save a reusable session (storage state) to a gitignored file.",
    inputSchema: {
      type: "object",
      properties: {
        timeoutSeconds: {
          type: "number",
          description: "How long to wait for MFA completion.",
          default: 600,
        },
        storageStatePath: {
          type: "string",
          description:
            "Override where to save the session storage state JSON (contains cookies).",
        },
        calendarUrl: {
          type: "string",
          description: "Override the calendar URL.",
        },
        slowMoMs: {
          type: "number",
          description: "Slow down browser actions for debugging.",
          default: 0,
        },
      },
    },
  },
  {
    name: "octorate_calendar_check",
    description:
      "Validate that a saved Octorate session (storage state) can open the calendar page without being redirected to login/MFA.",
    inputSchema: {
      type: "object",
      properties: {
        storageStatePath: {
          type: "string",
          description: "Path to the saved storage state JSON.",
        },
        calendarUrl: {
          type: "string",
          description: "Override the calendar URL.",
        },
      },
    },
  },
] as const;

export async function handleOctorateTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "octorate_login_interactive": {
        const parsed = loginInteractiveSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return errorResult(parsed.error.message);
        }

        const env = readOctorateEnv();
        if ("error" in env) {
          return errorResult(env.error);
        }

        const storageStatePath = parsed.data.storageStatePath || defaultStorageStatePath();
        const calendarUrl = parsed.data.calendarUrl || DEFAULT_CALENDAR_URL;
        const timeoutSeconds = parsed.data.timeoutSeconds ?? 600;
        const timeoutMs = timeoutSeconds * 1000;
        const slowMoMs = parsed.data.slowMoMs ?? 0;

        const chromePath = await resolveChromeExecutablePath(env.chromeExecutablePath);

        const browser = await chromium.launch({
          headless: false,
          slowMo: slowMoMs,
          executablePath: chromePath ?? undefined,
        });

        try {
          const context = await browser.newContext();
          const page = await context.newPage();

          await page.goto(DEFAULT_LOGIN_URL, {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          });

          await page.fill("#username", env.username);
          await page.fill("#password", env.password);

          await page.click("button[type=\"submit\"]");

          // Octorate may redirect immediately to MFA. If so, the user must complete it in the UI.
          await page.waitForLoadState("domcontentloaded", { timeout: 120_000 }).catch(() => {});

          const loginFormVisible = await page
            .locator("#username")
            .isVisible()
            .catch(() => false);

          if (loginFormVisible && !page.url().includes("/mfa.xhtml")) {
            return errorResult(
              "Octorate login did not progress (still on login form). Check credentials, then re-run octorate_login_interactive."
            );
          }

          if (page.url().includes("/mfa.xhtml")) {
            // Wait for the user to complete MFA in the opened browser window.
            await page.waitForFunction(
              () => !location.pathname.includes("mfa.xhtml"),
              { timeout: timeoutMs }
            );
          }

          await page.goto(calendarUrl, {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          });

          await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});

          if (page.url().includes("/mfa.xhtml")) {
            return errorResult(
              "Calendar load redirected to MFA. Complete MFA in the opened browser window and re-run octorate_login_interactive."
            );
          }

          await ensureParentDir(storageStatePath);
          await context.storageState({ path: storageStatePath });

          return jsonResult({
            status: "ok",
            calendarUrl: page.url(),
            storageStatePath,
            note:
              "Session saved. Future calls can run headless using octorate_calendar_check until the session expires.",
          });
        } finally {
          await browser.close().catch(() => {});
        }
      }

      case "octorate_calendar_check": {
        const parsed = calendarCheckSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return errorResult(parsed.error.message);
        }

        const storageStatePath = parsed.data.storageStatePath || defaultStorageStatePath();
        const calendarUrl = parsed.data.calendarUrl || DEFAULT_CALENDAR_URL;

        if (!(await fileExists(storageStatePath))) {
          return errorResult(
            `Storage state not found at ${storageStatePath}. Run octorate_login_interactive first.`
          );
        }

        const chromePath = await resolveChromeExecutablePath(process.env.OCTORATE_CHROME_EXECUTABLE?.trim());

        const browser = await chromium.launch({
          headless: true,
          executablePath: chromePath ?? undefined,
        });

        try {
          const context = await browser.newContext({
            storageState: storageStatePath,
          });

          const page = await context.newPage();
          await page.goto(calendarUrl, {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          });

          await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});

          const finalUrl = page.url();
          const title = await page.title();

          const ok =
            !finalUrl.includes("/mfa.xhtml") &&
            finalUrl.includes("/octobook/user/calendar/");

          return jsonResult({
            status: ok ? "ok" : "blocked",
            calendarUrl: finalUrl,
            title,
            storageStatePath,
            blockedReason: ok
              ? null
              : "Redirected to login/MFA; session likely expired. Re-run octorate_login_interactive.",
          });
        } finally {
          await browser.close().catch(() => {});
        }
      }

      default:
        return errorResult(`Unknown octorate tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
