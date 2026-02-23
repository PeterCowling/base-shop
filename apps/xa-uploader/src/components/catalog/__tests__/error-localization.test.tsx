/** @jest-environment jsdom */

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "../../../lib/catalogAdminSchema";
import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { useCatalogConsole } from "../useCatalogConsole.client";

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
    category: "clothing",
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
        <button type="button" onClick={() => state.setDraft(VALID_DRAFT)}>
          seed-draft
        </button>
        <button type="button" onClick={() => void state.handleSave()}>
          save
        </button>
        <button type="button" onClick={() => void state.handleDelete()}>
          delete
        </button>
        <div data-cy="draft-feedback">
          {state.actionFeedback.draft
            ? `${state.actionFeedback.draft.kind}:${state.actionFeedback.draft.message}`
            : ""}
        </div>
        <div data-cy="field-error-title">{state.fieldErrors.title ?? ""}</div>
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

describe("catalog console localized error surfaces", () => {
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

  it("TC-01: schema validation field errors are localized (zh)", async () => {
    window.localStorage.setItem("xa_uploader_locale", "zh");
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        return jsonResponse({ ok: true, products: [], revisionsById: {} });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh");
    });

    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "error:保存前请先修复校验错误。",
      );
    });
    expect(screen.getByTestId("field-error-title")).toHaveTextContent("标题不能为空。");
  });

  it("TC-02: API invalid/missing_product/not_found classes map to localized copy", async () => {
    let saveCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          saveCalls += 1;
          if (saveCalls === 1) {
            return jsonResponse(
              { ok: false, error: "missing_product", reason: "missing_product_payload" },
              { status: 400 },
            );
          }
          return jsonResponse(
            { ok: false, error: "invalid", reason: "catalog_validation_failed" },
            { status: 400 },
          );
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/products/studio-jacket?storefront=") && init?.method === "DELETE") {
        return jsonResponse({ ok: false, error: "not_found", reason: "product_not_found" }, { status: 404 });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "error:Product data is missing from this request.",
      );
    });

    await clickButton("save");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "error:The request data is invalid. Check the form and retry.",
      );
    });

    await clickButton("delete");
    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "error:The product no longer exists. Refresh and retry.",
      );
    });
  });

  it("TC-03: internal_error maps to safe localized fallback without leaking debug tokens", async () => {
    window.localStorage.setItem("xa_uploader_locale", "zh");
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse(
            {
              ok: false,
              error: "internal_error",
              reason: "products_upsert_failed",
              debugPath: "/Users/petercowling/base-shop/apps/xa-uploader/data/products.csv",
            },
            { status: 500 },
          );
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh");
    });

    await clickButton("seed-draft");
    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "error:服务器暂时无法完成请求，请稍后重试。",
      );
    });
    const feedbackText = screen.getByTestId("draft-feedback").textContent ?? "";
    expect(feedbackText).not.toContain("products_upsert_failed");
    expect(feedbackText).not.toContain("/Users/petercowling");
  });
});
