/** @jest-environment jsdom */

import * as React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { shouldTriggerAutosync } from "../catalogConsoleActions";
import * as catalogWorkflowModule from "../catalogWorkflow";
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
  popularity: "0",
  sizes: "S|M|L",
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

const AUTOSAVE_DRAFT_A: CatalogProductDraftInput = {
  ...VALID_DRAFT,
  imageFiles: "images/studio-jacket/front.jpg|images/studio-jacket/side.jpg",
  imageAltTexts: "front view|side view",
};

const AUTOSAVE_DRAFT_B: CatalogProductDraftInput = {
  ...AUTOSAVE_DRAFT_A,
  imageFiles:
    "images/studio-jacket/front.jpg|images/studio-jacket/side.jpg|images/studio-jacket/detail.jpg",
  imageAltTexts: "front view|side view|detail view",
};

const AUTOSAVE_DRAFT_SERVER_CONCURRENT: CatalogProductDraftInput = {
  ...AUTOSAVE_DRAFT_B,
  imageFiles:
    "images/studio-jacket/front.jpg|images/studio-jacket/side.jpg|images/studio-jacket/detail.jpg|images/studio-jacket/interior.jpg",
  imageAltTexts: "front view|side view|detail view|interior view",
};

const AUTOSAVE_DRAFT_SERVER_NON_IMAGE_CONCURRENT: CatalogProductDraftInput = {
  ...AUTOSAVE_DRAFT_A,
  title: "Studio jacket remote edit",
  price: "249",
  taxonomy: {
    ...AUTOSAVE_DRAFT_A.taxonomy,
    color: "navy",
  },
};

const PUBLISH_READY_WORKFLOW = {
  isDataReady: true,
  isPublishReady: true,
  missingFieldPaths: [],
  missingRoles: [],
};

const NOT_PUBLISH_READY_WORKFLOW = {
  isDataReady: true,
  isPublishReady: false,
  missingFieldPaths: [],
  missingRoles: ["front"],
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
        <button type="button" onClick={() => state.setDraft(VALID_DRAFT)}>
          seed-draft
        </button>
        <button type="button" onClick={() => void state.handleSaveWithDraft(AUTOSAVE_DRAFT_A)}>
          autosave-a
        </button>
        <button type="button" onClick={() => void state.handleSaveWithDraft(AUTOSAVE_DRAFT_B)}>
          autosave-b
        </button>
        <button type="button" onClick={() => state.handleSelect(AUTOSAVE_DRAFT_B)}>
          select-b
        </button>
        <button type="button" onClick={() => void state.handleSaveWithDraft(AUTOSAVE_DRAFT_A)}>
          autosave-remove-detail
        </button>
        <button type="button" onClick={() => void state.handleSave()}>
          save
        </button>
        <button type="button" onClick={() => void state.handleDelete()}>
          delete
        </button>
        <button type="button" onClick={() => void state.handleSync()}>
          sync
        </button>
        <div data-cy="busy">{state.busy ? "busy" : "idle"}</div>
        <div data-cy="autosave-dirty">{state.isAutosaveDirty ? "yes" : "no"}</div>
        <div data-cy="autosave-status">{state.autosaveStatus}</div>
        <div data-cy="sync-ready">{state.syncReadiness.ready ? "yes" : "no"}</div>
        <div data-cy="login-feedback">
          {state.actionFeedback.login
            ? `${state.actionFeedback.login.kind}:${state.actionFeedback.login.message}`
            : ""}
        </div>
        <div data-cy="draft-feedback">
          {state.actionFeedback.draft
            ? `${state.actionFeedback.draft.kind}:${state.actionFeedback.draft.message}`
            : ""}
        </div>
        <div data-cy="sync-feedback">
          {state.actionFeedback.sync ? `${state.actionFeedback.sync.kind}:${state.actionFeedback.sync.message}` : ""}
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

describe("useCatalogConsole scoped action feedback", () => {
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

  it("TC-00: initial autosave status is unsaved before any action", () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: false });
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    expect(screen.getByTestId("autosave-status")).toHaveTextContent("unsaved");
  });

  it("TC-01: failed login updates only login feedback", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: false });
      if (url === "/api/uploader/login") return jsonResponse({ ok: false }, { status: 401 });
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    fireEvent.change(screen.getByLabelText("token"), { target: { value: "bad-token" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "login" }).closest("form") as HTMLFormElement);
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-feedback")).toHaveTextContent("error:Unauthorized");
    });
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("");
    expect(screen.getByTestId("sync-feedback")).toHaveTextContent("");
  });

  it("TC-02: successful save and delete set draft success feedback", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url.startsWith("/api/catalog/products/studio-jacket?storefront=") && init?.method === "DELETE") {
        return jsonResponse({ ok: true });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();
    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });

    await clickButton("seed-draft");
    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "success:Saved product details.",
      );
    });

    await clickButton("delete");

    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "success:Deleted product studio-jacket.",
      );
    });
  });

  it("TC-03: sync feedback does not overwrite draft feedback", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        return jsonResponse({
          ok: true,
          logs: {
            validate: { code: 0, stdout: "ok", stderr: "" },
            sync: { code: 0, stdout: "ok", stderr: "" },
          },
        });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("draft-feedback")).toHaveTextContent(
        "success:Saved product details.",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });
    await clickButton("sync");

    await waitFor(() => {
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("success:Sync completed.");
    });
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
  });

  it("TC-03b: sync success feedback includes localized warnings returned by API", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        return jsonResponse({
          ok: true,
          warnings: ["publish_state_promotion_failed"],
          logs: {
            validate: { code: 0, stdout: "ok", stderr: "" },
            sync: { code: 0, stdout: "ok", stderr: "" },
          },
        });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });
    await clickButton("sync");

    await waitFor(() => {
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("success:Sync completed.");
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("Warnings:");
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent(
        "Some product publish states could not be updated to live in uploader records.",
      );
    });
  });

  it("TC-03c: sync warning parser localizes row/path warnings and hides raw unknown warning text", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" });
        }
        return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return jsonResponse({ ok: true, ready: true, missingScripts: [] });
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        return jsonResponse({
          ok: true,
          warnings: [
            "[row 2] \"studio-jacket\" has unsupported cloud image path \"images/legacy/1.jpg\" (invalid_cloud_key).",
            "opaque_warning_token",
          ],
          logs: {
            validate: { code: 0, stdout: "ok", stderr: "" },
            sync: { code: 0, stdout: "ok", stderr: "" },
          },
        });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");

    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });
    await clickButton("sync");

    await waitFor(() => {
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("Row 2: product");
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent(
        "cloud key must match storefront/slug/file format",
      );
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent(
        "Additional sync warnings were reported. Review sync output for details.",
      );
      expect(screen.getByTestId("sync-feedback")).not.toHaveTextContent("opaque_warning_token");
    });
  });

  it("TC-04: busy lock prevents duplicate save submissions while in-flight", async () => {
    let savePostCalls = 0;
    let resolveSavePost: ((response: Response) => void) | null = null;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          savePostCalls += 1;
          return new Promise<Response>((resolve) => {
            resolveSavePost = resolve;
          });
        }
        return Promise.resolve(
          jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("seed-draft");
    await clickButton("save");
    await clickButton("save");

    expect(savePostCalls).toBe(1);
    expect(screen.getByTestId("busy")).toHaveTextContent("busy");

    await act(async () => {
      resolveSavePost?.(jsonResponse({ ok: true, product: VALID_DRAFT, revision: "rev-1" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("busy")).toHaveTextContent("idle");
    });
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
  });

  it("TC-05: autosave queue flushes latest pending draft after in-flight save completes", async () => {
    let savePostCalls = 0;
    let resolveFirstAutosave: ((response: Response) => void) | null = null;
    const postedImageFiles: string[] = [];

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          const payload = JSON.parse(String(init.body ?? "{}")) as {
            product?: { imageFiles?: string };
          };
          postedImageFiles.push(payload.product?.imageFiles ?? "");
          savePostCalls += 1;
          if (savePostCalls === 1) {
            return new Promise<Response>((resolve) => {
              resolveFirstAutosave = resolve;
            });
          }
          return Promise.resolve(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_B, revision: "rev-2" }));
        }
        return Promise.resolve(
          jsonResponse({ ok: true, products: [AUTOSAVE_DRAFT_A], revisionsById: { p1: "rev-1" } }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();
    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
      expect(screen.getByTestId("busy")).toHaveTextContent("idle");
    });

    await clickButton("autosave-a");
    await clickButton("autosave-b");

    await waitFor(() => {
      expect(savePostCalls).toBeGreaterThanOrEqual(1);
    });

    await act(async () => {
      resolveFirstAutosave?.(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_A, revision: "rev-1" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("autosave-dirty")).toHaveTextContent("no");
    });

    expect(savePostCalls).toBeGreaterThanOrEqual(1);
    expect(postedImageFiles.join("|")).toContain("images/studio-jacket/detail.jpg");
  });

  it("TC-06: sync is blocked while autosave is pending", async () => {
    let resolveFirstAutosave: ((response: Response) => void) | null = null;
    let syncPostCalls = 0;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          return new Promise<Response>((resolve) => {
            resolveFirstAutosave = resolve;
          });
        }
        return Promise.resolve(
          jsonResponse({ ok: true, products: [AUTOSAVE_DRAFT_A], revisionsById: { p1: "rev-1" } }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        syncPostCalls += 1;
        return Promise.resolve(jsonResponse({ ok: true, logs: {} }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("autosave-a");
    await clickButton("sync");

    expect(syncPostCalls).toBe(0);
    await waitFor(() => {
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("error:Sync is blocked while image autosave is pending.");
    });

    await act(async () => {
      resolveFirstAutosave?.(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_A, revision: "rev-1" }));
    });
  });

  it("TC-07: autosave conflict retries once with merged image tuples and fresh revision", async () => {
    let savePostCalls = 0;
    let retryIfMatch: string | undefined;
    let retryImageFiles: string | undefined;
    let retryTitle: string | undefined;
    let retryPrice: string | undefined;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          savePostCalls += 1;
          const payload = JSON.parse(String(init.body ?? "{}")) as {
            ifMatch?: string;
            product?: { imageFiles?: string };
          };
          if (savePostCalls === 1) {
            return Promise.resolve(
              jsonResponse({ ok: false, error: "conflict", reason: "revision_conflict" }, { status: 409 }),
            );
          }
          retryIfMatch = payload.ifMatch;
          retryImageFiles = payload.product?.imageFiles;
          retryTitle = payload.product?.title;
          retryPrice = payload.product?.price;
          return Promise.resolve(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_B, revision: "rev-2" }));
        }
        return Promise.resolve(
          jsonResponse({
            ok: true,
            products: [AUTOSAVE_DRAFT_SERVER_NON_IMAGE_CONCURRENT],
            revisionsById: { p1: "rev-server" },
          }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("autosave-b");

    await waitFor(() => {
      expect(savePostCalls).toBe(2);
    });
    expect(retryIfMatch).toBe("rev-server");
    expect(retryImageFiles).toContain("images/studio-jacket/detail.jpg");
    expect(retryTitle).toBe("Studio jacket remote edit");
    expect(retryPrice).toBe("249");
    await waitFor(() => {
      expect(screen.getByTestId("autosave-dirty")).toHaveTextContent("no");
    });
  });

  it("TC-08: autosave conflict merge preserves local image deletion while keeping concurrent remote adds", async () => {
    let savePostCalls = 0;
    let retryIfMatch: string | undefined;
    let retryImageFiles: string | undefined;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          savePostCalls += 1;
          const payload = JSON.parse(String(init.body ?? "{}")) as {
            ifMatch?: string;
            product?: { imageFiles?: string };
          };
          if (savePostCalls === 1) {
            return Promise.resolve(
              jsonResponse({ ok: false, error: "conflict", reason: "revision_conflict" }, { status: 409 }),
            );
          }
          retryIfMatch = payload.ifMatch;
          retryImageFiles = payload.product?.imageFiles;
          return Promise.resolve(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_A, revision: "rev-2" }));
        }
        return Promise.resolve(
          jsonResponse({
            ok: true,
            products: [AUTOSAVE_DRAFT_SERVER_CONCURRENT],
            revisionsById: { p1: "rev-server" },
          }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();

    await clickButton("select-b");
    await clickButton("autosave-remove-detail");

    await waitFor(() => {
      expect(savePostCalls).toBe(2);
    });
    expect(retryIfMatch).toBe("rev-server");
    expect(retryImageFiles).toContain("images/studio-jacket/front.jpg");
    expect(retryImageFiles).toContain("images/studio-jacket/side.jpg");
    expect(retryImageFiles).toContain("images/studio-jacket/interior.jpg");
    expect(retryImageFiles).not.toContain("images/studio-jacket/detail.jpg");
  });

  it("TC-09: queued autosaves coalesce into one autosync after the queue drains", async () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    let savePostCalls = 0;
    let syncPostCalls = 0;
    let resolveFirstAutosave: ((response: Response) => void) | null = null;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
      if (url.startsWith("/api/catalog/products?storefront=")) {
        if (init?.method === "POST") {
          savePostCalls += 1;
          if (savePostCalls === 1) {
            return new Promise<Response>((resolve) => {
              resolveFirstAutosave = resolve;
            });
          }
          return Promise.resolve(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_B, revision: "rev-2" }));
        }
        return Promise.resolve(
          jsonResponse({ ok: true, products: [AUTOSAVE_DRAFT_A], revisionsById: { p1: "rev-1" } }),
        );
      }
      if (url.startsWith("/api/catalog/sync?storefront=")) {
        return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
      }
      if (url === "/api/catalog/sync" && init?.method === "POST") {
        syncPostCalls += 1;
        return Promise.resolve(jsonResponse({ ok: true, logs: {} }));
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }) as unknown as typeof fetch;

    renderHarness();
    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });

    await clickButton("autosave-a");
    await clickButton("autosave-b");

    expect(syncPostCalls).toBe(0);

    await act(async () => {
      resolveFirstAutosave?.(jsonResponse({ ok: true, product: AUTOSAVE_DRAFT_A, revision: "rev-1" }));
    });

    await waitFor(() => {
      expect(savePostCalls).toBe(2);
      expect(syncPostCalls).toBe(1);
    });
  });
});

describe("shouldTriggerAutosync", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns false while another autosave draft is still queued", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: AUTOSAVE_DRAFT_A },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(false);
  });

  it("returns false while the busy lock is held", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: true },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(false);
  });

  it("returns false when sync readiness is not confirmed", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: false },
        syncReadinessReady: false,
        syncReadinessChecking: false,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(false);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: true,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(false);
  });

  it("returns false when the product is not publish-ready", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(NOT_PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(false);
  });

  it("returns true when the queue is drained, sync is ready, and the product is publish-ready", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: AUTOSAVE_DRAFT_A,
      }),
    ).toBe(true);
  });
});
