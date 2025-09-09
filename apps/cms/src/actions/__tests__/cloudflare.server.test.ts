/** @jest-environment node */

const mockedEnv: any = {
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_TOKEN: "tok",
};

jest.mock("@acme/config/env/core", () => ({ coreEnv: mockedEnv }), { virtual: true });

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

import { provisionDomain } from "../cloudflare.server";
import { ensureAuthorized } from "../common/auth";

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock as any;
  mockedEnv.CLOUDFLARE_ACCOUNT_ID = "acc";
  mockedEnv.CLOUDFLARE_API_TOKEN = "tok";
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("provisionDomain", () => {
  it("returns status and certificateStatus on success", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [{ id: "zone1" }] }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { status: "active", certificate_status: "valid" },
        }),
      });

    const result = await provisionDomain("shop", "shop.example.com");

    expect(result).toEqual({ status: "active", certificateStatus: "valid" });
    expect(ensureAuthorized).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.cloudflare.com/client/v4/accounts/acc/pages/projects/shop/domains",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.cloudflare.com/client/v4/zones?name=example.com",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.cloudflare.com/client/v4/zones/zone1/dns_records",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "CNAME",
          name: "shop.example.com",
          content: "cname.pages.dev",
          ttl: 1,
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.cloudflare.com/client/v4/accounts/acc/pages/projects/shop/domains/shop.example.com/verify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws when credentials are missing", async () => {
    mockedEnv.CLOUDFLARE_API_TOKEN = undefined;
    await expect(provisionDomain("shop", "shop.example.com")).rejects.toThrow(
      "Cloudflare credentials not configured"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws add-domain API errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ message: "bad add" }] }),
    });

    await expect(provisionDomain("shop", "shop.example.com")).rejects.toThrow(
      "bad add"
    );
  });

  it("throws verification API errors", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [{ id: "zone1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: [{ message: "verify fail" }] }),
      });

    await expect(provisionDomain("shop", "shop.example.com")).rejects.toThrow(
      "verify fail"
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

