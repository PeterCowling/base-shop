/** @jest-environment jsdom */

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { useCatalogConsole } from "../useCatalogConsole.client";

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
  popularity: "0",
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
        <button type="button" onClick={() => state.handleSaveAdvanceFeedback()}>
          save-advance
        </button>
        <button type="button" onClick={() => void state.handleDelete()}>
          delete
        </button>
        <button type="button" onClick={() => state.handleSelect(VALID_DRAFT)}>
          select-draft
        </button>
        <button
          type="button"
          onClick={() => state.setDraft({ ...state.draft, slug: "edited-after-select", title: "Edited title" })}
        >
          mutate-slug
        </button>
        <button type="button" onClick={() => state.handleStorefrontChange("xa-c" as unknown as typeof state.storefront)}>
          switch-storefront
        </button>
        <button type="button" onClick={() => void state.handleSync()}>
          sync
        </button>

        <div data-cy="session-auth">{state.session?.authenticated ? "yes" : "no"}</div>
        <div data-cy="products-count">{state.products.length}</div>
        <div data-cy="selected-slug">{state.selectedSlug ?? ""}</div>
        <div data-cy="storefront">{state.storefront}</div>
        <div data-cy="draft-category">{state.draft.taxonomy.category}</div>
        <div data-cy="draft-revision">{state.draftRevision ?? ""}</div>
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
      </div>
    );
  }

  return render(
    <UploaderI18nProvider initialLocale="en">
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
    expect(screen.getByTestId("selected-slug")).toHaveTextContent("studio-jacket");

    await clickButton("logout");
    await waitFor(() => {
      expect(screen.getByTestId("session-auth")).toHaveTextContent("no");
    });
    expect(screen.getByTestId("products-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-slug")).toHaveTextContent("");
    expect(screen.getByTestId("draft-revision")).toHaveTextContent("");
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

  it("TC-03: storefront switch resets scoped state and draft defaults", async () => {
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

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
    });

    await clickButton("switch-storefront");
    expect(screen.getByTestId("storefront")).toHaveTextContent("xa-c");
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("");
    expect(screen.getByTestId("draft-category")).toHaveTextContent("clothing");
  });

  it("TC-03b: delete uses selected slug even if draft slug/title were edited", async () => {
    let deleted = false;
    const deleteCalls: string[] = [];
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
      if (url.startsWith("/api/catalog/products/")) {
        if (init?.method === "DELETE") {
          deleteCalls.push(url);
          deleted = true;
          return jsonResponse({ ok: true });
        }
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("selected-slug")).toHaveTextContent("studio-jacket");
    });

    await clickButton("mutate-slug");
    await clickButton("delete");

    await waitFor(() => {
      expect(deleteCalls).toContain("/api/catalog/products/studio-jacket?storefront=xa-b");
    });
    expect(deleteCalls).not.toContain("/api/catalog/products/edited-after-select?storefront=xa-b");
  });

  it("TC-03c: save-advance opens a new draft after a successful save", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-2" });
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-2" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("selected-slug")).toHaveTextContent("studio-jacket");
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
    });

    await clickButton("save-advance");

    expect(screen.getByTestId("selected-slug")).toHaveTextContent("");
    expect(screen.getByTestId("draft-revision")).toHaveTextContent("");
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
      "success:Saved. Ready for next product.",
    );
  });

  it("TC-04: sync action is gated when readiness check reports missing dependencies", async () => {
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
    expect(screen.getByTestId("sync-feedback")).toHaveTextContent(
      "error:Sync is blocked while image autosave is pending. Wait until image changes are saved.",
    );
  });
});
