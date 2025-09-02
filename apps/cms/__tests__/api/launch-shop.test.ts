import { jest } from "@jest/globals";
import { ReadableStream as NodeReadableStream } from "node:stream/web";
import {
  fetch as nodeFetch,
  Response as NodeResponse,
  Headers as NodeHeaders,
  Request as NodeRequest,
} from "undici";

// Ensure environment uses Undici's fetch/Response with streaming support
Object.assign(globalThis, {
  fetch: nodeFetch,
  Response: NodeResponse,
  Headers: NodeHeaders,
  Request: NodeRequest,
  ReadableStream: (globalThis as any).ReadableStream || NodeReadableStream,
});

// Mock environment variable
const originalEnv = process.env;
process.env = { ...process.env, CMS_BASE_URL: "https://cms.example" } as NodeJS.ProcessEnv;

// Mocks for service modules
const createShop = jest.fn();
const initShop = jest.fn();
const deployShop = jest.fn();
const seedShop = jest.fn();
const getRequiredSteps = jest.fn();

jest.mock("../../src/app/cms/wizard/services/createShop", () => ({
  __esModule: true,
  createShop: (...args: any[]) => createShop(...args),
}));

jest.mock("../../src/app/cms/wizard/services/initShop", () => ({
  __esModule: true,
  initShop: (...args: any[]) => initShop(...args),
}));

jest.mock("../../src/app/cms/wizard/services/deployShop", () => ({
  __esModule: true,
  deployShop: (...args: any[]) => deployShop(...args),
}));

jest.mock("../../src/app/cms/wizard/services/seedShop", () => ({
  __esModule: true,
  seedShop: (...args: any[]) => seedShop(...args),
}));

jest.mock("../../src/app/cms/configurator/steps", () => ({
  __esModule: true,
  getRequiredSteps: (...args: any[]) => getRequiredSteps(...args),
}));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = originalEnv;
});

function parseSse(text: string) {
  return text
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line.replace(/^data: /, "")));
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

describe("launch-shop API", () => {
  it("streams step updates on success", async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });
    seedShop.mockResolvedValue({ ok: true });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} }, seed: true }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    const text = await readStream(res.body as ReadableStream<Uint8Array>);
    const messages = parseSse(text);

    expect(messages).toEqual([
      { step: "create", status: "pending" },
      { step: "create", status: "success" },
      { step: "init", status: "pending" },
      { step: "init", status: "success" },
      { step: "deploy", status: "pending" },
      { step: "deploy", status: "success" },
      { step: "seed", status: "pending" },
      { step: "seed", status: "success" },
      { done: true },
    ]);
  });

  it("returns 400 when required steps are missing", async () => {
    getRequiredSteps.mockReturnValue([{ id: "a" }]);

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} } }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Missing required steps",
      missingSteps: ["a"],
    });
  });

  it("emits failure when downstream service errors", async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockImplementation(async () => {
      throw new Error("boom");
    });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} } }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    const text = await readStream(res.body as ReadableStream<Uint8Array>);
    const messages = parseSse(text);

    expect(messages).toEqual([
      { step: "create", status: "pending" },
      { step: "create", status: "success" },
      { step: "init", status: "pending" },
      { status: "failure", error: "boom" },
    ]);
  });
});

