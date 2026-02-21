import { promises as fs } from "node:fs";
import { join } from "node:path";

import type { Browser, BrowserContext, CDPSession, Download, Page } from "playwright-core";
import { chromium } from "playwright-core";

import type { BicPageIdentity } from "./bic.js";
import type { AxNodeFixture, DomNodeDescriptionFixture } from "./cdp.js";
import type {
  BrowserActRequest,
  BrowserDownload,
  BrowserDriver,
  BrowserObserveSnapshot,
  BrowserObserveSnapshotRequest,
} from "./driver.js";

type PlaywrightDriverState = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
  downloads: BrowserDownload[];
  downloadDir: string;
  pendingDownload: Download | null;
};

function safeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toAxNodeFixture(node: unknown): AxNodeFixture {
  const n = node as {
    role?: { value?: unknown };
    name?: { value?: unknown };
    backendDOMNodeId?: unknown;
    frameId?: unknown;
    ignored?: unknown;
  };

  return {
    role: { value: safeString(n.role?.value) },
    name: { value: safeString(n.name?.value) },
    backendDOMNodeId: typeof n.backendDOMNodeId === "number" ? n.backendDOMNodeId : undefined,
    frameId: safeString(n.frameId),
    ignored: typeof n.ignored === "boolean" ? n.ignored : undefined,
  };
}

async function buildPageIdentity(page: Page): Promise<BicPageIdentity> {
  const url = page.url();
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "unknown";
    }
  })();

  const title = await page.title().catch(() => "");
  const primaryHeading = await page
    .locator("h1")
    .first()
    .textContent()
    .then((v) => safeString(v))
    .catch(() => undefined);

  const lang = await page
    .evaluate(() => document.documentElement.lang || "")
    .then((v) => safeString(v))
    .catch(() => undefined);

  const routeKey = safeString(`${url}::${primaryHeading ?? ""}`);

  return {
    domain,
    url,
    finalUrl: url,
    lang,
    title: safeString(title),
    primaryHeading,
    routeKey,
    loadState: "interactive",
    blockingOverlay: { present: false },
    blockers: [],
    banners: [],
    modals: [],
    frames: page.frames().map((frame) => ({
      frameId: frame.name() || "frame",
      frameUrl: safeString(frame.url()),
      frameName: safeString(frame.name()),
    })),
  };
}

async function snapshotFromCdp(input: {
  state: PlaywrightDriverState;
  req: BrowserObserveSnapshotRequest;
}): Promise<BrowserObserveSnapshot> {
  const { page, cdp } = input.state;

  // Best-effort: ensure we're not capturing a half-loaded tree.
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const pageIdentity = await buildPageIdentity(page);

  const axResponse = (await cdp.send("Accessibility.getFullAXTree")) as { nodes?: unknown };
  const rawNodes = Array.isArray(axResponse.nodes) ? axResponse.nodes : [];
  const axNodes = rawNodes.map(toAxNodeFixture);

  // Pre-compute described nodes for interactive candidates only (keeps snapshot size bounded).
  const interactiveBackendIds = new Set<number>();
  for (const node of axNodes) {
    const role = node.role?.value ?? "";
    const backendDOMNodeId = node.backendDOMNodeId;
    if (!role || typeof backendDOMNodeId !== "number") {
      continue;
    }
    // Must match the interactive set in cdp.ts.
    if (
      role === "button" ||
      role === "textbox" ||
      role === "link" ||
      role === "checkbox" ||
      role === "radio" ||
      role === "combobox" ||
      role === "listbox" ||
      role === "option" ||
      role === "menuitem" ||
      role === "switch" ||
      role === "slider" ||
      role === "spinbutton" ||
      role === "tab" ||
      role === "searchbox"
    ) {
      interactiveBackendIds.add(backendDOMNodeId);
    }
  }

  const describedNodes: DomNodeDescriptionFixture[] = [];
  for (const backendNodeId of interactiveBackendIds) {
    try {
      const described = (await cdp.send("DOM.describeNode", {
        backendNodeId,
        depth: 1,
        pierce: true,
      })) as { node?: DomNodeDescriptionFixture["node"] };
      if (described.node) {
        describedNodes.push({ node: described.node });
      }
    } catch {
      // Ignore missing nodes; selector builder will fall back to best-effort.
    }
  }

  return {
    page: pageIdentity,
    axNodes,
    describedNodes,
  };
}

async function actViaPlaywright(input: { state: PlaywrightDriverState; req: BrowserActRequest }): Promise<void> {
  const { page } = input.state;

  if (input.req.target.kind === "page" && input.req.action.type === "navigate") {
    await page.goto(input.req.action.url, { waitUntil: "domcontentloaded" });
    return;
  }

  if (input.req.target.kind === "page" && input.req.action.type === "evaluate") {
    await page.evaluate(input.req.action.expression);
    return;
  }

  if (input.req.target.kind !== "element") {
    return;
  }

  const locator = page.locator(input.req.target.selector).first();

  switch (input.req.action.type) {
    case "click":
      await locator.click();
      return;
    case "fill":
      await locator.fill(input.req.action.value);
      return;
    case "navigate":
      // navigate is page-targeted; ignore if misrouted.
      return;
    case "evaluate":
      // evaluate is page-targeted; ignore if misrouted.
      return;
  }
}

export async function createPlaywrightBrowserDriver(input: {
  url: string;
  headless: boolean;
  slowMoMs?: number;
  executablePath?: string;
  storageStatePath?: string;
  downloadDir?: string;
}): Promise<BrowserDriver> {
  // Set up download directory
  const downloadDir = input.downloadDir ?? join(process.cwd(), ".tmp/downloads");
  await fs.mkdir(downloadDir, { recursive: true });

  const browser = await chromium.launch({
    headless: input.headless,
    slowMo: input.slowMoMs,
    executablePath: input.executablePath,
  });

  const context = await browser.newContext({
    storageState: input.storageStatePath,
    acceptDownloads: true,
  });

  const page = await context.newPage();

  const state: PlaywrightDriverState = {
    browser,
    context,
    page,
    cdp: await context.newCDPSession(page),
    downloads: [],
    downloadDir,
    pendingDownload: null,
  };

  // Set up download event handler
  page.on("download", async (download: Download) => {
    state.pendingDownload = download;

    try {
      const suggestedFilename = download.suggestedFilename();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const filename = `${timestamp}_${suggestedFilename}`;
      const filepath = join(downloadDir, filename);

      await download.saveAs(filepath);

      const stats = await fs.stat(filepath);
      const downloadRecord: BrowserDownload = {
        filename,
        path: filepath,
        size: stats.size,
        mimeType: null,
        timestamp: new Date().toISOString(),
      };

      state.downloads.push(downloadRecord);
      console.info(`[browser] Download saved: ${filepath} (${stats.size} bytes)`);
    } catch (error) {
      console.error(`[browser] Download failed:`, error);
    } finally {
      state.pendingDownload = null;
    }
  });

  await page.goto(input.url, { waitUntil: "domcontentloaded" });

  return {
    snapshot: async (req: BrowserObserveSnapshotRequest): Promise<BrowserObserveSnapshot> => {
      return await snapshotFromCdp({ state, req });
    },
    act: async (req: BrowserActRequest): Promise<void> => {
      await actViaPlaywright({ state, req });
    },
    getDownloads: async (): Promise<ReadonlyArray<BrowserDownload>> => {
      return state.downloads;
    },
    waitForDownload: async (input: { timeoutMs: number }): Promise<BrowserDownload | null> => {
      const startTime = Date.now();
      const initialCount = state.downloads.length;

      // Poll for new download
      while (Date.now() - startTime < input.timeoutMs) {
        if (state.downloads.length > initialCount) {
          return state.downloads[state.downloads.length - 1] ?? null;
        }

        if (state.pendingDownload) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return null;
    },
    close: async (): Promise<void> => {
      await browser.close();
    },
  };
}

