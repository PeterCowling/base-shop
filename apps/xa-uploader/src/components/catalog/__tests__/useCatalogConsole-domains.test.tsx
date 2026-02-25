/** @jest-environment jsdom */

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { useCatalogConsole } from "../useCatalogConsole.client";

const fetchSubmissionZipMock = jest.fn();
const downloadBlobMock = jest.fn();

jest.mock("../../../lib/catalogStorefront.ts", () => ({
  DEFAULT_STOREFRONT: "xa-b",
  XA_CATALOG_STOREFRONTS: [
    { id: "xa-b", appDir: "xa-b", labelKey: "storefrontXAB", defaultCategory: "bags" },
    { id: "xa-c", appDir: "xa-c", labelKey: "storefrontXAC", defaultCategory: "clothing" },
  ],
  parseStorefront: (value?: string | null) => (value === "xa-c" ? "xa-c" : "xa-b"),
  getStorefrontConfig: (value?: string | null) =>
    value === "xa-c"
      ? { id: "xa-c", appDir: "xa-c", labelKey: "storefrontXAC", defaultCategory: "clothing" }
      : { id: "xa-b", appDir: "xa-b", labelKey: "storefrontXAB", defaultCategory: "bags" },
}));

jest.mock("../catalogSubmissionClient", () => ({
  fetchSubmissionZip: (...args: unknown[]) => fetchSubmissionZipMock(...args),
  downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
}));

const VALID_DRAFT: CatalogProductDraftInput = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio jacket",
  brandHandle: "atelier-x",
  collectionHandle: "outerwear",
  collectionTitle: "Outerwear",
  price: "189",
  description: "A structured layer.",
  createdAt: "2025-12-01T12:00:00.000Z",
  forSale: true,
  forRental: false,
  popularity: "0",
  deposit: "0",
  stock: "1",
  sizes: "S|M|L",
  taxonomy: {
    department: "women",
    category: "bags",
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

function renderHarness() {
  function Harness() {
    const state = useCatalogConsole();
    return (
      <div>
        <form onSubmit={state.handleLogin}>
          <input
            aria-label="token"
            value={state.token}
            onChange={(event) => state.setToken(event.target.value)}
          />
          <button type="submit">login</button>
        </form>
        <button type="button" onClick={() => void state.handleLogout()}>
          logout
        </button>
        <button type="button" onClick={() => state.setDraft(VALID_DRAFT)}>
          seed-draft
        </button>
        <button type="button" onClick={() => void state.handleSave()}>
          save
        </button>
        <button type="button" onClick={() => void state.handleDelete()}>
          delete
        </button>
        <button type="button" onClick={() => state.handleSelect(VALID_DRAFT)}>
          select-draft
        </button>
        <button type="button" onClick={() => state.handleStorefrontChange("xa-c" as unknown as typeof state.storefront)}>
          switch-storefront
        </button>
        {Array.from({ length: 11 }, (_, idx) => {
          const slug = `slug-${idx + 1}`;
          return (
            <button key={slug} type="button" onClick={() => state.handleToggleSubmissionSlug(slug)}>
              {`toggle-${slug}`}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => state.setSubmissionUploadUrl("https://upload.local/upload/path-token")}
        >
          set-upload-url
        </button>
        <button type="button" onClick={() => void state.handleExportSubmission()}>
          export
        </button>
        <button type="button" onClick={() => void state.handleUploadSubmissionToR2()}>
          upload
        </button>
        <button type="button" onClick={() => state.handleClearSubmission()}>
          clear-submission
        </button>
        <button type="button" onClick={() => void state.handleSync()}>
          sync
        </button>
        <button type="button" onClick={() => void state.refreshSyncReadiness()}>
          refresh-sync-readiness
        </button>

        <div data-cy="session-auth">{state.session?.authenticated ? "yes" : "no"}</div>
        <div data-cy="products-count">{state.products.length}</div>
        <div data-cy="selected-slug">{state.selectedSlug ?? ""}</div>
        <div data-cy="storefront">{state.storefront}</div>
        <div data-cy="draft-category">{state.draft.taxonomy.category}</div>
        <div data-cy="draft-revision">{state.draftRevision ?? ""}</div>
        <div data-cy="submission-count">{state.submissionSlugs.size}</div>
        <div data-cy="sync-ready">{state.syncReadiness.ready ? "yes" : "no"}</div>
        <div data-cy="sync-checking">{state.syncReadiness.checking ? "yes" : "no"}</div>
        <div data-cy="sync-feedback">
          {state.actionFeedback.sync
            ? `${state.actionFeedback.sync.kind}:${state.actionFeedback.sync.message}`
            : ""}
        </div>
        <div data-cy="draft-feedback">
          {state.actionFeedback.draft
            ? `${state.actionFeedback.draft.kind}:${state.actionFeedback.draft.message}`
            : ""}
        </div>
        <div data-cy="submission-feedback">
          {state.actionFeedback.submission
            ? `${state.actionFeedback.submission.kind}:${state.actionFeedback.submission.message}`
            : ""}
        </div>
      </div>
    );
  }

  return render(
    <UploaderI18nProvider>
      <Harness />
    </UploaderI18nProvider>,
  );
}

async function clickButton(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

describe("useCatalogConsole domain behavior", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("TC-01: login/logout transitions reset key state slices", async () => {
    let sessionCall = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") {
        sessionCall += 1;
        return jsonResponse({ authenticated: sessionCall >= 2 });
      }
      if (url === "/api/uploader/login") return jsonResponse({ ok: true });
      if (url === "/api/uploader/logout") return jsonResponse({ ok: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await waitFor(() => {
      expect(screen.getByTestId("session-auth")).toHaveTextContent("no");
    });

    fireEvent.change(screen.getByLabelText("token"), { target: { value: "ok-token" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "login" }).closest("form") as HTMLFormElement);
    });

    await waitFor(() => {
      expect(screen.getByTestId("session-auth")).toHaveTextContent("yes");
    });
    expect(screen.getByTestId("products-count")).toHaveTextContent("1");

    await clickButton("select-draft");
    await clickButton("toggle-slug-1");
    expect(screen.getByTestId("selected-slug")).toHaveTextContent("studio-jacket");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("1");

    await clickButton("logout");
    await waitFor(() => {
      expect(screen.getByTestId("session-auth")).toHaveTextContent("no");
    });
    expect(screen.getByTestId("products-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-slug")).toHaveTextContent("");
    expect(screen.getByTestId("draft-revision")).toHaveTextContent("");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
  });

  it("TC-02: save/delete update draft revision and draft feedback", async () => {
    let deleted = false;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-2" });
        return jsonResponse({
          ok: true,
          products: deleted ? [] : [VALID_DRAFT],
          revisionsById: deleted ? {} : { p1: "rev-2" },
        });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url.startsWith("/api/catalog/products/studio-jacket?storefront=") && init?.method === "DELETE") {
        deleted = true;
        return jsonResponse({ ok: true });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
    });
    expect(screen.getByTestId("draft-revision")).toHaveTextContent("rev-2");

    await clickButton("delete");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "success:Deleted product studio-jacket.",
      );
    });
    expect(screen.getByTestId("draft-revision")).toHaveTextContent("");
    expect(screen.getByTestId("selected-slug")).toHaveTextContent("");
  });

  it("TC-03: submission toggle/export/upload preserve selection invariants", async () => {
    fetchSubmissionZipMock
      .mockResolvedValueOnce({
        blob: new Blob(["zip-1"]),
        filename: "submission.one.zip",
        submissionId: "sub-export",
        r2Key: "submissions/sub-export.zip",
      })
      .mockResolvedValueOnce({
        blob: new Blob(["zip-2"]),
        filename: "submission.two.zip",
        submissionId: "sub-upload",
        r2Key: "submissions/sub-upload.zip",
      });

    let uploadRequest: { url: string; headers: HeadersInit | undefined } | null = null;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        return jsonResponse({ ok: true, products: [], revisionsById: {} });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url === "https://upload.local/upload") {
        const requestHeaders =
          init?.headers ??
          (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
        uploadRequest = {
          url,
          headers: requestHeaders,
        };
        return new Response(null, { status: 200 });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();
    await clickButton("clear-submission");
    await waitFor(() => {
      expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
    });

    await clickButton("toggle-slug-1");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("1");
    await clickButton("toggle-slug-1");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("0");

    for (let idx = 1; idx <= 11; idx += 1) {
      await clickButton(`toggle-slug-${idx}`);
    }
    expect(screen.getByTestId("submission-count")).toHaveTextContent("10");

    await clickButton("export");
    await waitFor(() => {
      expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
    });
    expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
      "success:Submission ID: sub-export",
    );

    await clickButton("set-upload-url");
    await clickButton("toggle-slug-1");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("1");
    await clickButton("upload");

    await waitFor(() => {
      expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
    });
    expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
      "success:Uploaded submission sub-upload.",
    );
    expect(uploadRequest?.url).toBe("https://upload.local/upload");
    const normalizedHeaders =
      uploadRequest?.headers instanceof Headers
        ? Object.fromEntries(uploadRequest.headers.entries())
        : uploadRequest?.headers;
    expect(normalizedHeaders).toMatchObject({
      "Content-Type": "application/zip",
      "X-XA-Submission-Id": "sub-upload",
      "X-XA-Upload-Token": "path-token",
    });
  }, 15_000);

  it("TC-04: storefront switch resets scoped state and draft defaults", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();
    await clickButton("clear-submission");
    await waitFor(() => {
      expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
    });

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
    });
    await clickButton("toggle-slug-1");
    await waitFor(() => {
      expect(screen.getByTestId("submission-count")).toHaveTextContent("1");
    });

    await clickButton("switch-storefront");
    expect(screen.getByTestId("storefront")).toHaveTextContent("xa-c");
    expect(screen.getByTestId("submission-count")).toHaveTextContent("0");
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("");
    expect(screen.getByTestId("draft-category")).toHaveTextContent("clothing");
  });

  it("TC-05: sync action is gated when readiness check reports missing dependencies", async () => {
    let syncPostCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({
          ok: true,
          ready: false,
          missingScripts: ["validate"],
        });
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        syncPostCalls += 1;
        return jsonResponse({ ok: true });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("no");
      expect(screen.getByTestId("sync-checking")).toHaveTextContent("no");
    });

    await clickButton("sync");
    expect(syncPostCalls).toBe(0);
    expect(screen.getByTestId("sync-feedback")).toHaveTextContent("");
  });
});
