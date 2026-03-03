import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type WorkerMessageHandler = (event: { data: unknown }) => void;

const minisearchInstances: MockMiniSearch[] = [];

class MockMiniSearch {
  static loadJSON = jest.fn((index: string) => {
    if (index === "bad-index") {
      throw new Error("invalid index payload");
    }
    const instance = new MockMiniSearch({ loadedFrom: index });
    instance.loadedFrom = index;
    return instance;
  });

  docs: Array<{ id: string }> = [];
  loadedFrom?: string;

  constructor(_options?: unknown) {
    minisearchInstances.push(this);
  }

  addAll(docs: Array<{ id: string; shouldThrow?: boolean }>) {
    if (docs.some((doc) => doc.shouldThrow)) {
      throw new Error("build failed");
    }
    this.docs = docs;
  }

  search(query: string) {
    if (query === "throw-search") {
      throw new Error("search failed");
    }
    return [
      { id: "p1" },
      { id: 42 },
      { id: "p3" },
    ];
  }
}

jest.mock("minisearch", () => ({
  __esModule: true,
  default: MockMiniSearch,
}));

describe("xaSearch.worker", () => {
  let messageHandler: WorkerMessageHandler | null;
  let postMessageMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    minisearchInstances.length = 0;
    messageHandler = null;
    postMessageMock = jest.fn();

    Object.defineProperty(globalThis, "self", {
      configurable: true,
      value: {
        addEventListener: (type: string, handler: WorkerMessageHandler) => {
          if (type === "message") {
            messageHandler = handler;
          }
        },
        postMessage: postMessageMock,
      },
    });
  });

  async function loadWorker() {
    await import("../xaSearch.worker");
    expect(messageHandler).not.toBeNull();
  }

  it("build action serializes index and responds ok", async () => {
    await loadWorker();

    messageHandler?.({
      data: {
        requestId: "req-build",
        action: "build",
        docs: [{ id: "studio-jacket" }],
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "req-build",
        ok: true,
        action: "build",
        index: expect.any(String),
      }),
    );
  });

  it("load + search actions return ids and enforce limit", async () => {
    await loadWorker();

    messageHandler?.({
      data: {
        requestId: "req-load",
        action: "load",
        index: "serialized-index",
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      requestId: "req-load",
      ok: true,
      action: "load",
    });

    messageHandler?.({
      data: {
        requestId: "req-search",
        action: "search",
        query: "studio",
        limit: 2,
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      requestId: "req-search",
      ok: true,
      action: "search",
      ids: ["p1", "42"],
    });
  });

  it("search with empty query returns empty ids", async () => {
    await loadWorker();

    messageHandler?.({
      data: {
        requestId: "req-empty",
        action: "search",
        query: "   ",
        limit: 5,
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      requestId: "req-empty",
      ok: true,
      action: "search",
      ids: [],
    });
  });

  it("returns structured error on build failure", async () => {
    await loadWorker();

    messageHandler?.({
      data: {
        requestId: "req-build-fail",
        action: "build",
        docs: [{ id: "bad", shouldThrow: true }],
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      requestId: "req-build-fail",
      ok: false,
      action: "build",
      error: "build failed",
    });
  });

  it("returns structured error on load failure", async () => {
    await loadWorker();

    messageHandler?.({
      data: {
        requestId: "req-load-fail",
        action: "load",
        index: "bad-index",
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      requestId: "req-load-fail",
      ok: false,
      action: "load",
      error: "invalid index payload",
    });
  });
});
