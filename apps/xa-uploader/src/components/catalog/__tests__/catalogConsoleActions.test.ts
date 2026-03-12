import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { handleSaveImpl, mergeAutosaveImageTuples } from "../catalogConsoleActions";

// ---------------------------------------------------------------------------
// fetch mock — override global.fetch before any tests run
// ---------------------------------------------------------------------------
const fetchMock = jest.fn<() => Promise<Response>>();
beforeAll(() => {
  (global as Record<string, unknown>).fetch = fetchMock;
});

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const VALID_DRAFT = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio Jacket",
  brandHandle: "atelier-x",
  collectionHandle: "outerwear",
  collectionTitle: "Outerwear",
  price: "189",
  description: "A structured layer.",
  createdAt: "2025-12-01T12:00:00.000Z",
  popularity: "0",
  sizes: "S|M|L",
  imageFiles: "images/studio-jacket/front.jpg",
  imageAltTexts: "front view",
  publishState: "draft" as const,
  taxonomy: {
    department: "women" as const,
    category: "clothing" as const,
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

function makeHandleSaveParams(overrides: Record<string, unknown> = {}) {
  const busyLockRef = { current: false };
  return {
    draft: VALID_DRAFT,
    draftRevision: "rev-1",
    storefront: "xa-b" as const,
    t: (key: string) => key,
    busyLockRef,
    setBusy: jest.fn(),
    setActionFeedback: jest.fn(),
    setFieldErrors: jest.fn(),
    setDraftRevision: jest.fn(),
    loadCatalog: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    handleSelect: jest.fn(),
    confirmUnpublish: jest.fn<(msg: string) => boolean>().mockReturnValue(true),
    suppressSuccessFeedback: true,
    ...overrides,
  } as unknown as Parameters<typeof handleSaveImpl>[0];
}

// ---------------------------------------------------------------------------
// B1 — Autosave conflict retry
// ---------------------------------------------------------------------------
describe("handleSaveImpl — save conflict and retry", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("B1: returns { status: 'conflict' } when the server reports a revision conflict", async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, error: "conflict", reason: "revision_conflict" }, 409),
    );

    const result = await handleSaveImpl(makeHandleSaveParams());

    expect(result.status).toBe("conflict");
  });

  it("B1: returns { status: 'saved' } with updated revision on a successful retry after conflict", async () => {
    const savedProduct = { ...VALID_DRAFT };
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, product: savedProduct, revision: "rev-2" }),
    );

    const setDraftRevision = jest.fn();
    const result = await handleSaveImpl(
      makeHandleSaveParams({ draftRevision: "rev-merged", setDraftRevision }),
    );

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.revision).toBe("rev-2");
    }
    expect(setDraftRevision).toHaveBeenCalledWith("rev-2");
  });
});

// ---------------------------------------------------------------------------
// B2 — Image + autosave + cleanup cycle (pure function, no mocking required)
// ---------------------------------------------------------------------------
describe("mergeAutosaveImageTuples — image lifecycle", () => {
  const base = { ...VALID_DRAFT, imageFiles: "", imageAltTexts: "" };

  it("B2: new image uploaded locally appears in merged imageFiles", () => {
    const serverDraft = { ...base, imageFiles: "images/jacket/base.jpg", imageAltTexts: "base" };
    const localDraft = {
      ...base,
      imageFiles: "images/jacket/base.jpg|images/jacket/new.jpg",
      imageAltTexts: "base|new upload",
    };

    const merged = mergeAutosaveImageTuples({ serverDraft, localDraft });

    expect(merged.imageFiles).toContain("images/jacket/base.jpg");
    expect(merged.imageFiles).toContain("images/jacket/new.jpg");
  });

  it("B2: image deleted locally is absent from merged result even when still on server", () => {
    const baselineDraft = {
      ...base,
      imageFiles: "images/jacket/keep.jpg|images/jacket/remove.jpg",
      imageAltTexts: "keep|remove",
    };
    const serverDraft = {
      ...base,
      imageFiles: "images/jacket/keep.jpg|images/jacket/remove.jpg",
      imageAltTexts: "keep|remove",
    };
    // Local draft reflects user having deleted "remove.jpg"
    const localDraftAfterDelete = {
      ...base,
      imageFiles: "images/jacket/keep.jpg",
      imageAltTexts: "keep",
    };

    const merged = mergeAutosaveImageTuples({
      serverDraft,
      localDraft: localDraftAfterDelete,
      baselineDraft,
    });

    expect(merged.imageFiles).toContain("images/jacket/keep.jpg");
    expect(merged.imageFiles).not.toContain("images/jacket/remove.jpg");
  });
});

// ---------------------------------------------------------------------------
// B3 — suppressUiBusy: autosave must not touch the setBusy dispatcher
// ---------------------------------------------------------------------------
describe("handleSaveImpl — suppressUiBusy keeps UI busy state unchanged", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("B3: setBusy is NOT called during a successful autosave", async () => {
    const savedProduct = { ...VALID_DRAFT };
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, product: savedProduct, revision: "rev-2" }),
    );

    const setBusy = jest.fn();
    const result = await handleSaveImpl(
      makeHandleSaveParams({ setBusy, suppressUiBusy: true }),
    );

    expect(result.status).toBe("saved");
    expect(setBusy).not.toHaveBeenCalled();
  });

  it("B3: setBusy IS called during a manual save (suppressUiBusy absent)", async () => {
    const savedProduct = { ...VALID_DRAFT };
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, product: savedProduct, revision: "rev-2" }),
    );

    const setBusy = jest.fn();
    const result = await handleSaveImpl(makeHandleSaveParams({ setBusy }));

    expect(result.status).toBe("saved");
    expect(setBusy).toHaveBeenCalledWith(true);
    expect(setBusy).toHaveBeenCalledWith(false);
  });

  it("B3: setBusy is NOT called even when autosave encounters a save error", async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, error: "server_error" }, 500),
    );

    const setBusy = jest.fn();
    const result = await handleSaveImpl(
      makeHandleSaveParams({ setBusy, suppressUiBusy: true }),
    );

    expect(result.status).toBe("error");
    expect(setBusy).not.toHaveBeenCalled();
  });

  it("B3: busyLockRef is still used for mutual exclusion even when suppressUiBusy is true", async () => {
    const busyLockRef = { current: true }; // lock already held by another operation
    const setBusy = jest.fn();
    const result = await handleSaveImpl(
      makeHandleSaveParams({ busyLockRef, setBusy, suppressUiBusy: true }),
    );

    // Cannot acquire the lock → returns "busy" without calling fetch
    expect(result.status).toBe("busy");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setBusy).not.toHaveBeenCalled();
  });
});
