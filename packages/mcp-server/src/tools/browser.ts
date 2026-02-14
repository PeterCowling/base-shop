import { z } from "zod";

import { jsonResult } from "../utils/validation.js";

import { browserAct } from "./browser/act.js";
import { createPlaywrightBrowserDriver } from "./browser/driver-playwright.js";
import {
  browserErrorResult,
  type BrowserToolCallResult,
  type BrowserToolErrorEnvelope,
} from "./browser/errors.js";
import { browserObserve } from "./browser/observe.js";
import { BrowserSessionStore } from "./browser/session.js";

const store = new BrowserSessionStore();

function contractError(message: string, details?: Record<string, unknown>): BrowserToolCallResult {
  const error: BrowserToolErrorEnvelope = {
    code: "CONTRACT_MISMATCH",
    message,
    retryable: false,
    details,
  };
  return browserErrorResult(error);
}

function okPayload(data: unknown): BrowserToolCallResult {
  return jsonResult(data);
}

const observeArgsSchema = z
  .object({
    sessionId: z.string().min(1),
    mode: z.literal("a11y").optional().default("a11y"),
    scope: z.enum(["viewport", "document", "modal"]).optional().default("document"),
    maxAffordances: z.number().int().min(1).max(200).optional().default(50),
    includeHidden: z.boolean().optional().default(false),
    includeDisabled: z.boolean().optional().default(true),
    cursor: z.string().min(1).optional(),
  })
  .strict();

const expectationsSchema = z
  .object({
    urlContains: z.string().min(1).optional(),
    titleContains: z.string().min(1).optional(),
    headingContains: z.string().min(1).optional(),
    modalOpened: z.boolean().optional(),
    modalClosed: z.boolean().optional(),
    modalTitleContains: z.string().min(1).optional(),
    bannerContains: z.string().min(1).optional(),
  })
  .strict();

const actArgsSchema = z
  .object({
    sessionId: z.string().min(1),
    observationId: z.string().min(1),
    target: z
      .union([
        z.object({ kind: z.literal("page") }).strict(),
        z
          .object({
            kind: z.literal("element"),
            actionId: z.string().min(1),
            // Risk is used for safety-gating in the browser action pipeline.
            // Default to "safe" to keep tool calls concise.
            risk: z.enum(["safe", "caution", "danger"]).optional().default("safe"),
            label: z.string().min(1).optional(),
          })
          .strict(),
      ])
      .optional()
      .default({ kind: "page" }),
    action: z.union([
      z.object({ type: z.literal("click") }).strict(),
      z.object({ type: z.literal("fill"), value: z.string() }).strict(),
      z.object({ type: z.literal("navigate"), url: z.string().url() }).strict(),
    ]),
    confirm: z.boolean().optional(),
    confirmationText: z.string().optional(),
    expect: expectationsSchema.optional(),
  })
  .strict();

const sessionOpenArgsSchema = z
  .object({
    url: z.string().url(),
    headless: z.boolean().optional().default(true),
    slowMoMs: z.number().int().min(0).max(2000).optional(),
    executablePath: z.string().min(1).optional(),
    storageStatePath: z.string().min(1).optional(),
    downloadDir: z.string().min(1).optional(),
  })
  .strict();

const sessionCloseArgsSchema = z
  .object({
    sessionId: z.string().min(1),
  })
  .strict();

const getDownloadsArgsSchema = z
  .object({
    sessionId: z.string().min(1),
  })
  .strict();

const waitForDownloadArgsSchema = z
  .object({
    sessionId: z.string().min(1),
    timeoutMs: z.number().int().min(1000).max(60000).optional().default(30000),
  })
  .strict();

export const browserTools = [
  {
    name: "browser_session_open",
    description:
      "Open a new browser session (headless by default) and navigate to the given URL. Returns { sessionId }.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Initial URL to open" },
        headless: { type: "boolean", default: true },
        slowMoMs: { type: "number", default: 0 },
        executablePath: { type: "string", description: "Optional Chrome/Chromium executable path" },
        storageStatePath: { type: "string", description: "Path to Playwright storage state JSON for session persistence" },
        downloadDir: { type: "string", description: "Directory for downloads (default: .tmp/downloads)" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_session_close",
    description: "Close an existing browser session by sessionId.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "browser_observe",
    description:
      "Observe the current page state and enumerate targetable affordances (BIC v0.1). Requires an existing sessionId.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session identifier" },
        mode: { type: "string", enum: ["a11y"], default: "a11y" },
        scope: { type: "string", enum: ["viewport", "document", "modal"], default: "document" },
        maxAffordances: { type: "number", description: "Max affordances (1-200)", default: 50 },
        includeHidden: { type: "boolean", default: false },
        includeDisabled: { type: "boolean", default: true },
        cursor: { type: "string", description: "Paging cursor (from prior observation.nextCursor)" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "browser_act",
    description:
      "Execute an action (click/fill/navigate) and return verification + nextObservation (BIC v0.1).",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        observationId: { type: "string" },
        target: {
          anyOf: [
            { type: "object", properties: { kind: { const: "page" } }, required: ["kind"] },
            {
              type: "object",
              properties: { kind: { const: "element" }, actionId: { type: "string" } },
              required: ["kind", "actionId"],
            },
          ],
        },
        action: {
          anyOf: [
            { type: "object", properties: { type: { const: "click" } }, required: ["type"] },
            {
              type: "object",
              properties: { type: { const: "fill" }, value: { type: "string" } },
              required: ["type", "value"],
            },
            {
              type: "object",
              properties: { type: { const: "navigate" }, url: { type: "string" } },
              required: ["type", "url"],
            },
          ],
        },
        confirm: { type: "boolean" },
        confirmationText: { type: "string" },
        expect: { type: "object" },
      },
      required: ["sessionId", "observationId", "action"],
    },
  },
  {
    name: "browser_get_downloads",
    description:
      "Get list of all downloads for a session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session identifier" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "browser_wait_for_download",
    description:
      "Wait for a new download to complete. Returns { download: {...} } or { download: null } on timeout.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session identifier" },
        timeoutMs: { type: "number", description: "Timeout in milliseconds (default: 30000)", default: 30000 },
      },
      required: ["sessionId"],
    },
  },
] as const;

export async function handleBrowserTool(name: string, args: unknown): Promise<BrowserToolCallResult> {
  switch (name) {
    case "browser_session_open": {
      const parsed = sessionOpenArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_session_open.", {
          issues: parsed.error.issues,
        });
      }

      try {
        const driver = await createPlaywrightBrowserDriver({
          url: parsed.data.url,
          headless: parsed.data.headless,
          slowMoMs: parsed.data.slowMoMs,
          executablePath: parsed.data.executablePath,
          storageStatePath: parsed.data.storageStatePath,
          downloadDir: parsed.data.downloadDir,
        });
        const session = store.createSession({ driver });
        return okPayload({ sessionId: session.sessionId });
      } catch (error) {
        const envelope: BrowserToolErrorEnvelope = {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        };
        return browserErrorResult(envelope);
      }
    }

    case "browser_session_close": {
      const parsed = sessionCloseArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_session_close.", {
          issues: parsed.error.issues,
        });
      }

      const result = await store.closeSession(parsed.data.sessionId);
      if (!result.ok) {
        return browserErrorResult(result.error);
      }
      return okPayload({ ok: true });
    }

    case "browser_observe": {
      const parsed = observeArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_observe.", {
          issues: parsed.error.issues,
        });
      }

      const result = await browserObserve({
        store,
        sessionId: parsed.data.sessionId,
        mode: parsed.data.mode,
        scope: parsed.data.scope,
        maxAffordances: parsed.data.maxAffordances,
        includeHidden: parsed.data.includeHidden,
        includeDisabled: parsed.data.includeDisabled,
        cursor: parsed.data.cursor,
      });

      if (!result.ok) {
        return browserErrorResult(result.error);
      }

      return okPayload(result.value.observation);
    }

    case "browser_act": {
      const parsed = actArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_act.", {
          issues: parsed.error.issues,
        });
      }

      const result = await browserAct({
        store,
        sessionId: parsed.data.sessionId,
        observationId: parsed.data.observationId,
        target: parsed.data.target,
        action: parsed.data.action,
        confirm: parsed.data.confirm,
        confirmationText: parsed.data.confirmationText,
        expect: parsed.data.expect,
      });

      if (!result.ok) {
        return browserErrorResult(result.error);
      }

      return okPayload(result.value);
    }

    case "browser_get_downloads": {
      const parsed = getDownloadsArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_get_downloads.", {
          issues: parsed.error.issues,
        });
      }

      const session = store.getSession(parsed.data.sessionId);
      if (!session) {
        const envelope: BrowserToolErrorEnvelope = {
          code: "SESSION_NOT_FOUND",
          message: `Session ${parsed.data.sessionId} not found`,
          retryable: false,
        };
        return browserErrorResult(envelope);
      }

      try {
        const downloads = await session.driver.getDownloads();
        return okPayload({ downloads });
      } catch (error) {
        const envelope: BrowserToolErrorEnvelope = {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        };
        return browserErrorResult(envelope);
      }
    }

    case "browser_wait_for_download": {
      const parsed = waitForDownloadArgsSchema.safeParse(args);
      if (!parsed.success) {
        return contractError("Invalid arguments for browser_wait_for_download.", {
          issues: parsed.error.issues,
        });
      }

      const session = store.getSession(parsed.data.sessionId);
      if (!session) {
        const envelope: BrowserToolErrorEnvelope = {
          code: "SESSION_NOT_FOUND",
          message: `Session ${parsed.data.sessionId} not found`,
          retryable: false,
        };
        return browserErrorResult(envelope);
      }

      try {
        const download = await session.driver.waitForDownload({
          timeoutMs: parsed.data.timeoutMs,
        });
        return okPayload({ download });
      } catch (error) {
        const envelope: BrowserToolErrorEnvelope = {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        };
        return browserErrorResult(envelope);
      }
    }

    default:
      return contractError(`Unknown browser tool: ${name}`);
  }
}
