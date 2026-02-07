import { ReadableStream as NodeReadableStream } from "node:stream/web";

import { jest } from "@jest/globals";
import {
  fetch as nodeFetch,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from "undici";

Object.assign(globalThis, {
  fetch: nodeFetch,
  Headers: NodeHeaders,
  Request: NodeRequest,
  ReadableStream: (globalThis as any).ReadableStream || NodeReadableStream,
});

async function readStream(stream: any) {
  const decoder = new TextDecoder();
  let result = "";
  if (typeof stream === "string") {
    return stream;
  }
  if (typeof stream?.getReader === "function") {
    const reader = stream.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } else if (stream && Symbol.asyncIterator in stream) {
    for await (const chunk of stream) {
      result += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
    }
  } else if (stream != null) {
    result += String(stream);
  }
  result += decoder.decode();
  return result;
}

class TestResponse {
  body: any;
  status: number;
  headers: Headers;
  constructor(body?: any, init: ResponseInit = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.headers = new Headers(init.headers);
  }
  static json(data: any, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return new TestResponse(JSON.stringify(data), { ...init, headers });
  }
  async text() {
    return readStream(this.body);
  }
  async json() {
    return JSON.parse(await this.text());
  }
  async arrayBuffer() {
    const text = await this.text();
    return new TextEncoder().encode(text).buffer;
  }
}

Object.assign(globalThis, {
  Response: TestResponse,
});

const createShop = jest.fn() as unknown as jest.Mock;
const initShop = jest.fn() as unknown as jest.Mock;
const deployShop = jest.fn() as unknown as jest.Mock;
const seedShop = jest.fn() as unknown as jest.Mock;
const getRequiredSteps = jest.fn() as unknown as jest.Mock;
const getConfiguratorProgressForShop = jest.fn() as unknown as jest.Mock;
const runRequiredConfigChecks = jest.fn() as unknown as jest.Mock;

jest.mock("../src/app/cms/wizard/services/createShop", () => ({
  __esModule: true,
  createShop: (...args: any[]) => createShop(...args),
}));

jest.mock("../src/app/cms/wizard/services/initShop", () => ({
  __esModule: true,
  initShop: (...args: any[]) => initShop(...args),
}));

jest.mock("../src/app/cms/wizard/services/deployShop", () => ({
  __esModule: true,
  deployShop: (...args: any[]) => deployShop(...args),
}));

jest.mock("../src/app/cms/wizard/services/seedShop", () => ({
  __esModule: true,
  seedShop: (...args: any[]) => seedShop(...args),
}));

jest.mock("../src/app/cms/configurator/steps", () => ({
  __esModule: true,
  getRequiredSteps: (...args: any[]) => getRequiredSteps(...args),
}));

jest.mock("@acme/platform-core/configurator", () => ({
  __esModule: true,
  getConfiguratorProgressForShop: (...args: any[]) =>
    getConfiguratorProgressForShop(...args),
  runRequiredConfigChecks: (...args: any[]) => runRequiredConfigChecks(...args),
  configuratorChecks: {},
}));

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (name === "csrf_token" ? { value: "token" } : undefined),
  }),
}));

jest.mock("@cms/actions/common/auth", () => ({
  __esModule: true,
  ensureAuthorized: (jest.fn() as unknown as jest.Mock).mockResolvedValue({ user: { id: "test-user", role: "admin" } }),
}));

jest.mock("@cms/actions/common/auth", () => ({
  __esModule: true,
  ensureAuthorized: (jest.fn() as unknown as jest.Mock).mockResolvedValue({ user: { id: "test-user", role: "admin" } }),
}));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

function parseSse(text: string) {
  return text
    .trim()
    .split("\n\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.replace(/^data: /, "")));
}

describe("launch-shop happy path", () => {
  it("seeds data, completes configurator, launches, and streams full success", async () => {
    getRequiredSteps.mockReturnValue([{ id: "a", label: "A" }]);
    getConfiguratorProgressForShop.mockResolvedValue({
      shopId: "1",
      steps: { a: "complete" },
      lastUpdated: new Date().toISOString(),
    });
    runRequiredConfigChecks.mockResolvedValue({ ok: true });
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });
    seedShop.mockResolvedValue({ ok: true });

    const { POST } = await import("../src/app/api/launch-shop/route");
    const req = {
      json: async () => ({
        shopId: "1",
        state: { completed: { a: "complete" } },
        seed: true,
        env: "stage",
      }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    const messages = parseSse(text);
    expect(messages).toEqual([
      { step: "create", status: "pending" },
      { step: "create", status: "success" },
      { step: "init", status: "pending" },
      { step: "init", status: "success" },
      { step: "deploy", status: "pending" },
      { step: "deploy", status: "success" },
      { step: "tests", status: "pending" },
      { step: "tests", status: "success" },
      { step: "seed", status: "pending" },
      { step: "seed", status: "success" },
      { done: true },
    ]);
  });
});
