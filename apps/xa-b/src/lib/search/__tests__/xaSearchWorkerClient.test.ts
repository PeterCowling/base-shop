import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type ListenerMap = {
  message: Array<(event: MessageEvent) => void>;
  error: Array<(event: ErrorEvent) => void>;
};

class MockWorker {
  static instances: MockWorker[] = [];

  listeners: ListenerMap = { message: [], error: [] };
  postMessage = jest.fn();

  constructor() {
    MockWorker.instances.push(this);
  }

  addEventListener(type: "message" | "error", listener: ((event: MessageEvent) => void) | ((event: ErrorEvent) => void)) {
    if (type === "message") {
      this.listeners.message.push(listener as (event: MessageEvent) => void);
      return;
    }
    this.listeners.error.push(listener as (event: ErrorEvent) => void);
  }

  emitMessage(data: unknown) {
    for (const listener of this.listeners.message) {
      listener({ data } as MessageEvent);
    }
  }

  emitError(error: Error) {
    const event = new ErrorEvent("error", { error });
    for (const listener of this.listeners.error) {
      listener(event);
    }
  }
}

describe("xaSearchWorkerClient", () => {
  beforeEach(() => {
    jest.resetModules();
    MockWorker.instances = [];
    Object.defineProperty(globalThis, "Worker", {
      writable: true,
      value: MockWorker,
    });
  });

  it("builds index via worker request/response", async () => {
    const { buildXaSearchIndex } = await import("../xaSearchWorkerClient");

    const pending = buildXaSearchIndex([{ id: "p1", title: "Studio Jacket" } as never]);
    const worker = MockWorker.instances[0];

    const request = worker?.postMessage.mock.calls[0]?.[0] as { requestId: string };
    worker?.emitMessage({ requestId: request.requestId, action: "build", ok: true, index: "serialized-index" });

    await expect(pending).resolves.toBe("serialized-index");
  });

  it("throws worker-provided errors for search requests", async () => {
    const { searchXaIndex } = await import("../xaSearchWorkerClient");

    const pending = searchXaIndex("studio", 5);
    const worker = MockWorker.instances[0];

    const request = worker?.postMessage.mock.calls[0]?.[0] as { requestId: string };
    worker?.emitMessage({ requestId: request.requestId, action: "search", ok: false, error: "index_not_loaded" });

    await expect(pending).rejects.toThrow("index_not_loaded");
  });

  it("rejects all pending requests when worker emits an error", async () => {
    const { loadXaSearchIndex, searchXaIndex } = await import("../xaSearchWorkerClient");

    const pendingLoad = loadXaSearchIndex("serialized-index");
    const pendingSearch = searchXaIndex("studio", 2);
    const worker = MockWorker.instances[0];

    worker?.emitError(new Error("worker crashed"));

    await expect(pendingLoad).rejects.toThrow("worker crashed");
    await expect(pendingSearch).rejects.toThrow("worker crashed");
  });
});
