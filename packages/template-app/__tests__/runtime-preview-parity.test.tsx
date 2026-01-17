/** @jest-environment jsdom */

import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import type { HistoryState, TemplateDescriptor } from "@acme/page-builder-core";
import DynamicRenderer from "../src/components/DynamicRenderer";

const secret = "preview-secret";
const upgradeSecret = "upgrade-secret";
const shopId = "preview-shop";
const pageId = "preview-page";
const touchedEnv = [
  "DATA_ROOT",
  "PAGES_BACKEND",
  "PREVIEW_TOKEN_SECRET",
  "UPGRADE_PREVIEW_TOKEN_SECRET",
  "NEXT_PUBLIC_SHOP_ID",
];
const originalEnv = Object.fromEntries(
  touchedEnv.map((key) => [key, process.env[key]]),
) as Record<string, string | undefined>;

jest.setTimeout(15000);

function restoreEnv(): void {
  touchedEnv.forEach((key) => {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
}

async function setupPreviewFixture() {
  jest.resetModules();
  const dataRoot = await fs.mkdtemp(path.join(tmpdir(), "pb-preview-"));
  process.env.DATA_ROOT = dataRoot;
  process.env.PAGES_BACKEND = "json";
  process.env.PREVIEW_TOKEN_SECRET = secret;
  process.env.UPGRADE_PREVIEW_TOKEN_SECRET = upgradeSecret;
  process.env.NEXT_PUBLIC_SHOP_ID = shopId;

  jest.doMock("@acme/config/env/core", () => ({
    __esModule: true,
    coreEnv: {
      PREVIEW_TOKEN_SECRET: secret,
      UPGRADE_PREVIEW_TOKEN_SECRET: upgradeSecret,
      NEXT_PUBLIC_SHOP_ID: shopId,
    },
  }));
  jest.doMock("@acme/ui/hooks/usePreviewDevice", () => ({
    usePreviewDevice: () => ["desktop", jest.fn()],
  }));
  jest.doMock("@acme/ui/components/DeviceSelector", () => ({
    __esModule: true,
    default: () => null,
  }));

  const { scaffoldPageFromTemplate } = await import("@acme/page-builder-core");
  const { savePage } = await import(
    "@acme/platform-core/repositories/pages/index.server"
  );
  const { createPreviewToken } = await import("@acme/platform-core/previewTokens");
  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const { default: PreviewPage } = await import(
    "../src/app/preview/[pageId]/page"
  );

  const descriptor: TemplateDescriptor = {
    id: "test.preview.simple",
    version: "1.0.0",
    kind: "page",
    label: "Preview parity",
    category: "Test",
    pageType: "marketing",
    components: [
      {
        id: "text-1",
        type: "Text",
        text: "Preview parity block",
      },
    ],
  };

  const now = new Date().toISOString();
  const page = scaffoldPageFromTemplate(
    descriptor,
    { shopId, locale: "en", primaryLocale: "en" },
    {
      id: pageId,
      slug: "preview-parity",
      status: "published",
      createdAt: now,
      updatedAt: now,
      createdBy: "tester",
    },
  );

  const history: HistoryState = {
    past: [],
    present: page.components,
    future: [],
    gridCols: 12,
    editor: {
      "text-1": { hidden: ["mobile"], stackStrategy: "reverse" },
    },
  };
  page.history = history;

  await savePage(shopId, page);
  const token = createPreviewToken({ shopId, pageId }, secret);

  const cleanup = async () => {
    await fs.rm(dataRoot, { recursive: true, force: true });
    restoreEnv();
  };

  return { onRequest, PreviewPage, token, createPreviewToken, cleanup };
}

describe("runtime preview parity", () => {
  it("round-trips a published page through the preview route and renders with the starter registry", async () => {
    const { onRequest, PreviewPage, token, cleanup } =
      await setupPreviewFixture();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const originalFetch = global.fetch;

    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw =
        typeof input === "string" || input instanceof URL
          ? input.toString()
          : (input as Request).url;
      const url = new URL(raw, "http://localhost");
      if (!url.pathname.startsWith("/preview/")) {
        if (typeof originalFetch === "function") {
          return originalFetch(input as any, init as any);
        }
        throw new Error(`Unexpected fetch: ${url.toString()}`);
      }
      const req = new Request(url.toString(), init);
      return onRequest({
        params: { pageId: url.pathname.split("/").pop()! },
        request: req,
      } as any);
    };

    try {
      (global as any).fetch = fetchImpl;
      const ui = (await PreviewPage({
        params: Promise.resolve({ pageId }),
        searchParams: Promise.resolve({ token }),
      })) as ReactElement;
      render(
        <DynamicRenderer
          components={ui.props.components}
          locale={ui.props.locale}
          editor={ui.props.editor}
        />,
      );
      const textarea = document.querySelector(
        'textarea[text="Preview parity block"]',
      ) as HTMLTextAreaElement | null;
      expect(textarea).not.toBeNull();
      expect(textarea?.className).toContain("pb-stack-mobile-reverse");
      const wrapper = textarea?.closest(".pb-scope");
      expect(wrapper?.className).toContain("pb-hide-mobile");
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining("Unknown component type"),
      );
    } finally {
      (global as any).fetch = originalFetch;
      warn.mockRestore();
      await cleanup();
    }
  });

  it("enforces token validation and missing-page handling on the preview route", async () => {
    const { onRequest, createPreviewToken, cleanup } =
      await setupPreviewFixture();
    try {
      const missingToken = await onRequest({
        params: { pageId },
        request: new Request(`http://localhost/preview/${pageId}`),
      } as any);
      expect(missingToken.status).toBe(401);

      const badToken = await onRequest({
        params: { pageId },
        request: new Request(`http://localhost/preview/${pageId}?token=bad`),
      } as any);
      expect(badToken.status).toBe(401);

      const absentToken = createPreviewToken(
        { shopId, pageId: "absent" },
        secret,
      );
      const missingPage = await onRequest({
        params: { pageId: "absent" },
        request: new Request(
          `http://localhost/preview/absent?token=${absentToken}`,
        ),
      } as any);
      expect(missingPage.status).toBe(404);
    } finally {
      await cleanup();
    }
  });
});
