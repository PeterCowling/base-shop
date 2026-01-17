import { NextRequest } from "next/server";

const validateShopName = jest.fn((s: string) => s);
jest.mock("@acme/lib", () => ({ validateShopName }));

const readSeoAudits = jest.fn();
const appendSeoAudit = jest.fn();
jest.mock("@acme/platform-core/repositories/seoAudit.server", () => ({
  readSeoAudits,
  appendSeoAudit,
}));

const lighthouse = jest.fn();
jest.mock("lighthouse", () => ({ __esModule: true, default: lighthouse }));

const nowIso = jest.fn(() => "t");
jest.mock("@acme/date-utils", () => ({ nowIso }));

process.env.LIGHTHOUSE_TRUSTED_HOSTS = "example.com";
let route: typeof import("../route");

beforeAll(async () => {
  route = await import("../route");
  route.TRUSTED_HOSTS.add("example.com");
});

beforeEach(() => {
  jest.clearAllMocks();
});

function getReq() {
  return new NextRequest("http://test.local");
}

function postReq(body: unknown) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body: JSON.stringify(body),
  } as any);
}

describe("GET", () => {
  it("returns audits from readSeoAudits", async () => {
    const audits = [
      { timestamp: "now", score: 90, recommendations: ["a"] },
    ];
    readSeoAudits.mockResolvedValue(audits);
    const res = await route.GET(getReq(), {
      params: Promise.resolve({ shop: "shop1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(audits);
    expect(readSeoAudits).toHaveBeenCalledWith("shop1");
  });
});

describe("POST", () => {
  it("returns 400 for invalid URL", async () => {
    const res = await route.POST(postReq({ url: "bad" }), {
      params: Promise.resolve({ shop: "shop1" }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid URL" });
  });

  it("returns 400 for untrusted hostname", async () => {
    const res = await route.POST(postReq({ url: "http://evil.com" }), {
      params: Promise.resolve({ shop: "shop1" }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "URL not allowed" });
  });

  it("runs lighthouse and appends audit", async () => {
    lighthouse.mockResolvedValue({
      lhr: {
        categories: { seo: { score: 0.8 } },
        audits: {
          a1: { score: 0.5, scoreDisplayMode: "numeric", title: "rec" },
        },
      },
    });
    appendSeoAudit.mockResolvedValue(undefined);
    const url = "http://example.com/page";
    const res = await route.POST(postReq({ url }), {
      params: Promise.resolve({ shop: "shop1" }),
    });
    const expected = { timestamp: "t", score: 80, recommendations: ["rec"] };
    expect(res.status).toBe(200);
    expect(appendSeoAudit).toHaveBeenCalledWith("shop1", expected);
    await expect(res.json()).resolves.toEqual(expected);
  });
});

