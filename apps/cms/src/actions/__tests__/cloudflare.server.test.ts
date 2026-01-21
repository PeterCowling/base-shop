/** @jest-environment node */

import { provisionDomain } from "../cloudflare.server";
import { ensureAuthorized } from "../common/auth";

const mockedEnv: any = {
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_TOKEN: "tok",
};

jest.mock("@acme/config/env/core", () => ({ coreEnv: mockedEnv }), { virtual: true });

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

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

  it("skips DNS record fetch when zone lookup returns empty result", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { status: "pending", certificate_status: "pending_validation" },
        }),
      });

    const result = await provisionDomain("shop", "shop.example.com");

    expect(result).toEqual({
      status: "pending",
      certificateStatus: "pending_validation",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.cloudflare.com/client/v4/zones?name=example.com",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.cloudflare.com/client/v4/accounts/acc/pages/projects/shop/domains/shop.example.com/verify",
      expect.objectContaining({ method: "POST" })
    );
    expect(
      fetchMock.mock.calls.some((call) =>
        (call[0] as string).includes("/dns_records")
      )
    ).toBe(false);
  });

  it("resolves with verify results even if DNS record creation fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [{ id: "zone1" }] }) })
      .mockRejectedValueOnce(new Error("dns fail"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { status: "active", certificate_status: "valid" },
        }),
      });

    const result = await provisionDomain("shop", "shop.example.com");

    expect(result).toEqual({ status: "active", certificateStatus: "valid" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.cloudflare.com/client/v4/zones/zone1/dns_records",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns undefined statuses when verify response is empty", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [{ id: "zone1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: () => ({}) });

    const result = await provisionDomain("shop", "shop.example.com");

    expect(result).toEqual({ status: undefined, certificateStatus: undefined });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.cloudflare.com/client/v4/accounts/acc/pages/projects/shop/domains/shop.example.com/verify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it.each([
    ["CLOUDFLARE_ACCOUNT_ID", () => (mockedEnv.CLOUDFLARE_ACCOUNT_ID = undefined)],
    ["CLOUDFLARE_API_TOKEN", () => (mockedEnv.CLOUDFLARE_API_TOKEN = undefined)],
  ])("throws when %s is missing", async (_name, unset) => {
    unset();
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

  it("defaults cname target when verification data is missing", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) })
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

    await provisionDomain("shop", "shop.example.com");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.cloudflare.com/client/v4/zones/zone1/dns_records",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "CNAME",
          name: "shop.example.com",
          content: "shop.pages.dev",
          ttl: 1,
        }),
      })
    );
  });

  it("returns default message when add-domain fails without errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [] }),
    });

    await expect(
      provisionDomain("shop", "shop.example.com")
    ).rejects.toThrow("Failed to provision domain");
  });

  it("returns default message when verification fails without errors", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [] }) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: [] }),
      });

    await expect(
      provisionDomain("shop", "shop.example.com")
    ).rejects.toThrow("Failed to issue certificate");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns undefined status fields when verify result lacks data", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verification_data: { cname_target: "cname.pages.dev" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) });

    const result = await provisionDomain("shop", "shop.example.com");

    expect(result).toEqual({
      status: undefined,
      certificateStatus: undefined,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

