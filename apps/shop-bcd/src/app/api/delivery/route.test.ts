/** @jest-environment node */
import fs from "node:fs";
import nodePath from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { NextRequest, NextResponse } from "next/server";

const parseJsonBody = jest.fn();
const initPlugins = jest.fn();

jest.mock("@shared-utils", () => ({ parseJsonBody }));
jest.mock("@platform-core/plugins", () => ({ initPlugins }));

function req() {
  return new NextRequest("http://test.local", { method: "POST" } as any);
}

function loadRoute(shopMock: any) {
  const src = fs.readFileSync(nodePath.join(__dirname, "route.ts"), "utf8");
  let js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  js = js.replace(/const require = .*createRequire.*\n/, "");
  js = js.replace(/import\.meta\.url/g, JSON.stringify(pathToFileURL(nodePath.join(__dirname, "route.ts")).href));
  const mod: any = { exports: {} };
  const mockRequire = (id: string) => {
    if (id.endsWith("shop.json")) return { default: shopMock };
    if (id === "node:path") return { default: nodePath };
    return require(id);
  };
  const func = new Function("exports", "require", "module", "__filename", "__dirname", js);
  func(mod.exports, mockRequire, mod, __filename, __dirname);
  return mod.exports as { POST: typeof import("./route").POST };
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("POST", () => {
  it("returns 400 when premier-shipping not listed", async () => {
    const { POST } = loadRoute({ shippingProviders: [] });
    const res = await POST(req());

    expect(res.status).toBe(400);
    expect(parseJsonBody).not.toHaveBeenCalled();
  });

  it("returns 400 on validation errors", async () => {
    const { POST } = loadRoute({ shippingProviders: ["premier-shipping"] });
    parseJsonBody.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: "bad" }, { status: 400 }),
    });
    const res = await POST(req());

    expect(res.status).toBe(400);
    expect(parseJsonBody).toHaveBeenCalled();
  });

  it("schedules pickup when request is valid", async () => {
    const { POST } = loadRoute({ shippingProviders: ["premier-shipping"] });
    const schedulePickup = jest.fn();
    initPlugins.mockResolvedValue({
      shipping: new Map([["premier-shipping", { schedulePickup }]]),
    } as any);
    parseJsonBody.mockResolvedValue({
      success: true,
      data: {
        region: "us",
        date: "2024-01-01",
        window: "9-11",
        carrier: "ups",
      },
    });
    const res = await POST(req());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(schedulePickup).toHaveBeenCalledWith(
      "us",
      "2024-01-01",
      "9-11",
      "ups",
    );
  });
});

