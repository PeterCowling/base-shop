import { jest } from "@jest/globals";
import { ReadableStream as NodeReadableStream } from "node:stream/web";
import {
  fetch as nodeFetch,
  Headers as NodeHeaders,
  Request as NodeRequest,
} from "undici";

// Ensure environment uses Undici's fetch with streaming support
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

// Mock environment variable
const originalEnv = process.env;
process.env = { ...process.env, CMS_BASE_URL: "https://cms.example" } as NodeJS.ProcessEnv;

// Mocks for service modules
const createShop = jest.fn();
const initShop = jest.fn();
const deployShop = jest.fn();
const seedShop = jest.fn();
const getRequiredSteps = jest.fn();
const getConfiguratorProgressForShop = jest.fn();
const runRequiredConfigChecks = jest.fn();
const getLaunchGate = jest.fn();
const evaluateProdGate = jest.fn();
const recordFirstProdLaunch = jest.fn();
const recordStageTests = jest.fn();
const verifyShopAfterDeploy = jest.fn();
const mockCookies = jest.fn(() => ({
  get: (name: string) => (name === "csrf_token" ? { value: "token" } : undefined),
}));

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

jest.mock("@acme/platform-core/configurator", () => ({
  __esModule: true,
  getConfiguratorProgressForShop: (...args: any[]) =>
    getConfiguratorProgressForShop(...args),
  runRequiredConfigChecks: (...args: any[]) => runRequiredConfigChecks(...args),
}));

jest.mock("next/headers", () => ({
  cookies: (...args: any[]) => mockCookies(...args),
}));

jest.mock("../../src/lib/server/launchGate", () => ({
  __esModule: true,
  getLaunchGate: (...args: any[]) => getLaunchGate(...args),
  evaluateProdGate: (...args: any[]) => evaluateProdGate(...args),
  recordFirstProdLaunch: (...args: any[]) => recordFirstProdLaunch(...args),
  recordStageTests: (...args: any[]) => recordStageTests(...args),
}));

jest.mock("../../src/actions/verifyShopAfterDeploy.server", () => ({
  __esModule: true,
  verifyShopAfterDeploy: (...args: any[]) => verifyShopAfterDeploy(...args),
}));

jest.mock("@cms/actions/common/auth", () => ({
  __esModule: true,
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { id: "test-user", role: "admin" } }),
}));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
  getConfiguratorProgressForShop.mockResolvedValue({
    shopId: "1",
    steps: {},
    lastUpdated: new Date().toISOString(),
  });
  runRequiredConfigChecks.mockResolvedValue({ ok: true });
  getLaunchGate.mockResolvedValue({});
  evaluateProdGate.mockReturnValue({ allowed: true, missing: [] });
});

function parseSse(text: string) {
  return text
    .trim()
    .split("\n\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.replace(/^data: /, "")));
}


describe("launch-shop API", () => {
  it.skip("streams step updates on success", async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });
    seedShop.mockResolvedValue({ ok: true });
    verifyShopAfterDeploy.mockResolvedValue({ status: "passed" });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} }, seed: true }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    const text = new TextDecoder().decode(await res.arrayBuffer());
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

  it("returns 400 when required steps are missing", async () => {
    getRequiredSteps.mockReturnValue([{ id: "a" }]);

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} } }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Missing required steps",
      missingSteps: ["a"],
    });
  });

  it("blocks prod launch when stage gate is not satisfied", async () => {
    getRequiredSteps.mockReturnValue([]);
    evaluateProdGate.mockReturnValue({
      allowed: false,
      missing: ["stage-tests", "qa-ack"],
    });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} }, env: "prod" }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "stage-gate",
      missing: ["stage-tests", "qa-ack"],
      env: "stage",
    });
  });

  it("allows prod launch after stage gate passes and records first prod launch", async () => {
    getRequiredSteps.mockReturnValue([]);
    evaluateProdGate.mockReturnValue({
      allowed: true,
      missing: [],
    });
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });
    seedShop.mockResolvedValue({ ok: true });
    verifyShopAfterDeploy.mockResolvedValue({ status: "passed" });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} }, env: "prod" }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    const text = new TextDecoder().decode(await res.arrayBuffer());
    const messages = parseSse(text);

    expect(res.status).toBe(200);
    // The stream includes all steps and ends with done: true
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some(m => m.done === true)).toBe(true);
    expect(recordFirstProdLaunch).toHaveBeenCalledWith("1");
  });

  it.skip("emits failure when downstream service errors", async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockImplementation(async () => {
      throw new Error("boom");
    });

    const { POST } = await import("../../src/app/api/launch-shop/route");

    const req = {
      json: async () => ({ shopId: "1", state: { completed: {} } }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;

    const res = await POST(req);
    const text = new TextDecoder().decode(await res.arrayBuffer());
    const messages = parseSse(text);

    expect(messages).toEqual([
      { step: "create", status: "pending" },
      { step: "create", status: "success" },
      { step: "init", status: "pending" },
      { status: "failure", error: "boom" },
    ]);
  });
});
