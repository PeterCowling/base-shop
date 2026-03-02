/** @jest-environment jsdom */

import * as React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { SubmissionApiError } from "../catalogSubmissionClient";
import { useCatalogConsole } from "../useCatalogConsole.client";

const fetchSubmissionZipMock = jest.fn();
const downloadBlobMock = jest.fn();

jest.mock("../catalogSubmissionClient", () => {
  const actual = jest.requireActual("../catalogSubmissionClient") as Record<string, unknown>;
  return {
    ...actual,
    fetchSubmissionZip: (...args: unknown[]) => fetchSubmissionZipMock(...args),
    downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
  };
});

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

function createDeferred<T>() {
  let resolveFn!: (value: T | PromiseLike<T>) => void;
  let rejectFn!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
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
        <button type="button" onClick={() => state.handleToggleSubmissionSlug(VALID_DRAFT.slug ?? "p1")}>
          toggle-submission
        </button>
        <button type="button" onClick={() => void state.handleSave()}>
          save
        </button>
        <button type="button" onClick={() => void state.handleDelete()}>
          delete
        </button>
        <button type="button" onClick={() => void state.handleExportSubmission()}>
          export
        </button>
        <input
          aria-label="upload-url"
          value={state.submissionUploadUrl}
          onChange={(event) => state.setSubmissionUploadUrl(event.target.value)}
        />
        <button type="button" onClick={() => void state.handleUploadSubmissionToR2()}>
          upload
        </button>
        <button type="button" onClick={() => void state.handleSync()}>
          sync
        </button>
        <div data-cy="busy">{state.busy ? "busy" : "idle"}</div>
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
        <div data-cy="submission-feedback">
          {state.actionFeedback.submission
            ? `${state.actionFeedback.submission.kind}:${state.actionFeedback.submission.message}`
            : ""}
        </div>
        <div data-cy="submission-step">{state.submissionStep ?? ""}</div>
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
    expect(screen.getByTestId("submission-feedback")).toHaveTextContent("");
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

  it("TC-03: submission/sync feedback updates do not overwrite draft feedback", async () => {
    fetchSubmissionZipMock.mockResolvedValue({
      blob: new Blob(["zip"]),
      filename: "submission.test.zip",
      submissionId: "sub-123",
      r2Key: "r2://bucket/submissions/sub-123.zip",
    });

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

    await clickButton("toggle-submission");
    await clickButton("export");

    await waitFor(() => {
      expect(screen.getByTestId("submission-feedback")).toHaveTextContent("success:Submission ID: sub-123");
    });
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");

    await waitFor(() => {
      expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
    });
    await clickButton("sync");

    await waitFor(() => {
      expect(screen.getByTestId("sync-feedback")).toHaveTextContent("success:Sync completed.");
    });
    expect(screen.getByTestId("draft-feedback")).toHaveTextContent("success:Saved product details.");
  });

  describe("TASK-02: per-step progress labels", () => {
    function mockConsoleBootstrapFetch() {
      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
        if (url.startsWith("/api/catalog/products?storefront=")) {
          return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
        }
        if (url.startsWith("/api/catalog/sync?storefront=")) {
          return jsonResponse({ ok: true, ready: true, missingScripts: [] });
        }
        if (init?.method === "PUT") {
          return new Response(null, { status: 200 });
        }
        throw new Error(`Unhandled fetch: ${url}`);
      }) as unknown as typeof fetch;
    }

    it("TC-01: Export action — step label shown during in-flight export", async () => {
      const zipDeferred = createDeferred<{
        blob: Blob;
        filename: string;
        submissionId: string;
        r2Key: string;
      }>();
      fetchSubmissionZipMock.mockReturnValue(zipDeferred.promise);
      mockConsoleBootstrapFetch();

      renderHarness();
      await waitFor(() => {
        expect(screen.getByTestId("sync-ready")).toHaveTextContent("yes");
      });
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-step")).toHaveTextContent("Building package…");
      });

      await act(async () => {
        zipDeferred.resolve({
          blob: new Blob(["zip"]),
          filename: "submission.test.zip",
          submissionId: "sub-123",
          r2Key: "r2://bucket/submissions/sub-123.zip",
        });
        await zipDeferred.promise;
      });

      await waitFor(() => {
        expect(screen.getByTestId("submission-step")).toHaveTextContent("");
      });
      expect(screen.getByTestId("submission-feedback")).toHaveTextContent("success:Submission ID: sub-123");
    });

    it("TC-02: Upload action — step label transitions during in-flight upload", async () => {
      const uploadDeferred = createDeferred<Response>();
      fetchSubmissionZipMock.mockResolvedValue({
        blob: new Blob(["zip"]),
        filename: "submission.test.zip",
        submissionId: "sub-123",
        r2Key: "r2://bucket/submissions/sub-123.zip",
      });
      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/uploader/session") return Promise.resolve(jsonResponse({ authenticated: true }));
        if (url.startsWith("/api/catalog/products?storefront=")) {
          return Promise.resolve(
            jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } }),
          );
        }
        if (url.startsWith("/api/catalog/sync?storefront=")) {
          return Promise.resolve(jsonResponse({ ok: true, ready: true, missingScripts: [] }));
        }
        if (init?.method === "PUT") {
          return uploadDeferred.promise;
        }
        throw new Error(`Unhandled fetch: ${url}`);
      }) as unknown as typeof fetch;

      renderHarness();
      fireEvent.change(screen.getByLabelText("upload-url"), {
        target: { value: "https://upload.local/upload/path-token" },
      });
      await clickButton("toggle-submission");
      await clickButton("upload");

      await waitFor(() => {
        expect(screen.getByTestId("submission-step")).toHaveTextContent("Uploading…");
      });

      await act(async () => {
        uploadDeferred.resolve(new Response(null, { status: 200 }));
        await uploadDeferred.promise;
      });

      await waitFor(() => {
        expect(screen.getByTestId("submission-step")).toHaveTextContent("");
      });
    });

    it("TC-03: Export action fails — step label absent after failure", async () => {
      fetchSubmissionZipMock.mockRejectedValue(new Error("internal_error"));
      mockConsoleBootstrapFetch();

      renderHarness();
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
          "The server could not complete this request. Try again.",
        );
      });
      expect(screen.getByTestId("submission-step")).toHaveTextContent("");
    });

    it("TC-04: Clear submission — step label cleared", async () => {
      fetchSubmissionZipMock.mockResolvedValue({
        blob: new Blob(["zip"]),
        filename: "submission.test.zip",
        submissionId: "sub-123",
        r2Key: "r2://bucket/submissions/sub-123.zip",
      });
      mockConsoleBootstrapFetch();

      renderHarness();
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent("success:Submission ID: sub-123");
      });
      expect(screen.getByTestId("submission-step")).toHaveTextContent("");
    });
  });

  describe("TASK-01: submission validation error reason", () => {
    function mockConsoleBootstrapFetch() {
      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
        if (url.startsWith("/api/catalog/products?storefront=")) {
          return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
        }
        if (url.startsWith("/api/catalog/sync?storefront=")) {
          return jsonResponse({ ok: true, ready: true, missingScripts: [] });
        }
        throw new Error(`Unhandled fetch: ${url}`);
      }) as unknown as typeof fetch;
    }

    it("TC-01: Export action with validation failure reason", async () => {
      fetchSubmissionZipMock.mockRejectedValue(
        new SubmissionApiError("invalid", "submission_validation_failed"),
      );
      mockConsoleBootstrapFetch();

      renderHarness();
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
          "Submission validation failed. Check product count, image sizes, and image files, then retry.",
        );
      });
    });

    it("TC-02: Export action with internal_error reason", async () => {
      fetchSubmissionZipMock.mockRejectedValue(new Error("internal_error"));
      mockConsoleBootstrapFetch();

      renderHarness();
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
          "The server could not complete this request. Try again.",
        );
      });
    });

    it("TC-03: Export action with unknown error code", async () => {
      fetchSubmissionZipMock.mockRejectedValue(new Error("unknown_code"));
      mockConsoleBootstrapFetch();

      renderHarness();
      await clickButton("toggle-submission");
      await clickButton("export");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent("Export failed.");
      });
    });

    it("TC-04: Upload action with validation failure reason", async () => {
      fetchSubmissionZipMock.mockRejectedValue(
        new SubmissionApiError("invalid", "submission_validation_failed"),
      );
      let uploadPutCalls = 0;
      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/uploader/session") return jsonResponse({ authenticated: true });
        if (url.startsWith("/api/catalog/products?storefront=")) {
          return jsonResponse({ ok: true, products: [VALID_DRAFT], revisionsById: { p1: "rev-1" } });
        }
        if (url.startsWith("/api/catalog/sync?storefront=")) {
          return jsonResponse({ ok: true, ready: true, missingScripts: [] });
        }
        if (init?.method === "PUT") {
          uploadPutCalls += 1;
          return new Response(null, { status: 200 });
        }
        throw new Error(`Unhandled fetch: ${url}`);
      }) as unknown as typeof fetch;

      renderHarness();
      fireEvent.change(screen.getByLabelText("upload-url"), {
        target: { value: "https://upload.local/upload/path-token" },
      });
      await clickButton("toggle-submission");
      await clickButton("upload");

      await waitFor(() => {
        expect(screen.getByTestId("submission-feedback")).toHaveTextContent(
          "Submission validation failed. Check product count, image sizes, and image files, then retry.",
        );
      });
      expect(uploadPutCalls).toBe(0);
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
});
