/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";

const parseJsonBody = jest.fn();
const initPlugins = jest.fn();
const nextResponseJson = jest.fn(
  (body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  })
);

jest.mock("@shared-utils", () => ({ parseJsonBody }));
jest.mock("@platform-core/plugins", () => ({ initPlugins }));
jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

const SHOP_JSON_PATH = "../../../../shop.json";
const DEFAULT_SHOP = { shippingProviders: ["premier-shipping"] };

const createRequest = (): NextRequest =>
  ({ method: "POST" } as unknown as NextRequest);

async function loadPost(
  shopConfig = DEFAULT_SHOP
): Promise<(typeof import("./route"))["POST"]> {
  jest.resetModules();
  jest.doMock(SHOP_JSON_PATH, () => ({
    __esModule: true,
    default: shopConfig,
  }));
  const mod = await import("./route");
  jest.dontMock(SHOP_JSON_PATH);
  return mod.POST;
}

const originalPluginsDir = process.env.PREMIER_SHIPPING_PLUGINS_DIR;

beforeEach(() => {
  jest.resetAllMocks();
  nextResponseJson.mockImplementation((body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  }));
  if (originalPluginsDir === undefined) {
    delete process.env.PREMIER_SHIPPING_PLUGINS_DIR;
  } else {
    process.env.PREMIER_SHIPPING_PLUGINS_DIR = originalPluginsDir;
  }
});

afterAll(() => {
  if (originalPluginsDir === undefined) {
    delete process.env.PREMIER_SHIPPING_PLUGINS_DIR;
  } else {
    process.env.PREMIER_SHIPPING_PLUGINS_DIR = originalPluginsDir;
  }
});

it("returns 400 when premier shipping is unavailable", async () => {
  const POST = await loadPost({ shippingProviders: [] });
  const response = await POST(createRequest());

  expect(response.status).toBe(400);
  expect(nextResponseJson).toHaveBeenCalledWith(
    { error: "Premier shipping not available" },
    { status: 400 }
  );
  expect(parseJsonBody).not.toHaveBeenCalled();
});

it("returns validation error responses from parseJsonBody", async () => {
  const POST = await loadPost();
  const validationResponse = { status: 422 } as const;
  parseJsonBody.mockResolvedValue({ success: false, response: validationResponse });

  const response = await POST(createRequest());

  expect(response).toBe(validationResponse);
  expect(nextResponseJson).not.toHaveBeenCalled();
});

it("returns 400 when the premier shipping provider is missing", async () => {
  const POST = await loadPost();
  parseJsonBody.mockResolvedValue({
    success: true,
    data: { region: "us", date: "2024-01-01", window: "9-11" },
  });
  initPlugins.mockResolvedValue({ shipping: new Map() });
  const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);

  const response = await POST(createRequest());

  expect(response.status).toBe(400);
  expect(nextResponseJson).toHaveBeenCalledWith(
    { error: "Premier shipping not available" },
    { status: 400 }
  );
  expect(initPlugins).toHaveBeenCalledTimes(1);
  existsSpy.mockRestore();
});

it("schedules pickups with the parsed payload", async () => {
  const POST = await loadPost();
  const schedulePickup = jest.fn();
  parseJsonBody.mockResolvedValue({
    success: true,
    data: {
      region: "us",
      date: "2024-01-01",
      window: "9-11",
      carrier: "ups",
    },
  });
  initPlugins.mockResolvedValue({
    shipping: new Map([["premier-shipping", { schedulePickup }]]),
  });
  const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);

  const response = await POST(createRequest());

  expect(schedulePickup).toHaveBeenCalledWith("us", "2024-01-01", "9-11", "ups");
  expect(nextResponseJson).toHaveBeenCalled();
  const lastCall =
    nextResponseJson.mock.calls[nextResponseJson.mock.calls.length - 1]!;
  expect(lastCall[0]).toEqual({ ok: true });
  expect(lastCall[1]).toBeUndefined();
  await expect(response.json()).resolves.toEqual({ ok: true });
  expect(response.status).toBe(200);
  existsSpy.mockRestore();
});

it("returns provider errors as 400 responses", async () => {
  const POST = await loadPost();
  const schedulePickup = jest.fn().mockRejectedValue(new Error("boom"));
  parseJsonBody.mockResolvedValue({
    success: true,
    data: {
      region: "us",
      date: "2024-01-01",
      window: "9-11",
      carrier: "ups",
    },
  });
  initPlugins.mockResolvedValue({
    shipping: new Map([["premier-shipping", { schedulePickup }]]),
  });
  const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);

  const response = await POST(createRequest());

  expect(response.status).toBe(400);
  expect(nextResponseJson).toHaveBeenLastCalledWith(
    { error: "boom" },
    { status: 400 }
  );
  existsSpy.mockRestore();
});

it("uses PREMIER_SHIPPING_PLUGINS_DIR when resolving plugins", async () => {
  const expectedDir = path.resolve("/custom/plugins");
  process.env.PREMIER_SHIPPING_PLUGINS_DIR = "/custom/plugins";

  const POST = await loadPost();
  const schedulePickup = jest.fn();
  parseJsonBody.mockResolvedValue({
    success: true,
    data: {
      region: "us",
      date: "2024-01-01",
      window: "9-11",
      carrier: "ups",
    },
  });
  initPlugins.mockResolvedValue({
    shipping: new Map([["premier-shipping", { schedulePickup }]]),
  });
  const existsSpy = jest
    .spyOn(fs, "existsSync")
    .mockImplementation((target: fs.PathLike) => {
      if (typeof target !== "string") {
        return false;
      }
      return path.resolve(target) === expectedDir;
    });

  const response = await POST(createRequest());

  expect(initPlugins).toHaveBeenCalledWith(
    expect.objectContaining({ directories: [expectedDir] })
  );
  await expect(response.json()).resolves.toEqual({ ok: true });
  existsSpy.mockRestore();
});

it("falls back to locating packages/plugins relative to cwd", async () => {
  const startingCwd = "/repo/apps/cover-me-pretty";
  const parentCwd = path.dirname(startingCwd);
  const rootCwd = path.dirname(parentCwd);
  const rootPluginsDir = path.resolve(path.join(rootCwd, "packages", "plugins"));
  const searchResults = new Map<string, boolean>([
    [path.resolve(path.join(startingCwd, "packages", "plugins")), false],
    [path.resolve(path.join(parentCwd, "packages", "plugins")), false],
    [rootPluginsDir, true],
  ]);

  const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(startingCwd);
  const existsSpy = jest
    .spyOn(fs, "existsSync")
    .mockImplementation((target: fs.PathLike) => {
      if (typeof target !== "string") {
        return false;
      }
      const normalized = path.resolve(target);
      return searchResults.get(normalized) ?? false;
    });

  const POST = await loadPost();
  const schedulePickup = jest.fn();
  parseJsonBody.mockResolvedValue({
    success: true,
    data: {
      region: "us",
      date: "2024-01-01",
      window: "9-11",
      carrier: "ups",
    },
  });
  initPlugins.mockResolvedValue({
    shipping: new Map([["premier-shipping", { schedulePickup }]]),
  });

  const response = await POST(createRequest());

  expect(initPlugins).toHaveBeenCalledWith(
    expect.objectContaining({ directories: [rootPluginsDir] })
  );
  await expect(response.json()).resolves.toEqual({ ok: true });
  existsSpy.mockRestore();
  cwdSpy.mockRestore();
});
