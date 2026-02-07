import { jest } from "@jest/globals";

import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  defaultShopId,
  jwt,
  loadOnRequestPost,
  logger,
  resetTestState,
} from "./publish-upgrade.test-helpers";

let onRequestPost: OnRequestPost;
const id = defaultShopId;

beforeAll(async () => {
  onRequestPost = await loadOnRequestPost();
});

beforeEach(() => {
  resetTestState();
});

describe("onRequestPost validation", () => {
  describe("id validation", () => {
    it("rejects missing id", async () => {
      const warn = logger.warn as jest.Mock;
      warn.mockImplementation(() => {});

      const res = await onRequestPost({
        params: {} as any,
        request: new Request("http://example.com", { method: "POST" }),
      });

      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Invalid shop id" });
      expect(warn).toHaveBeenCalledWith(
        "invalid shop id",
        expect.objectContaining({ id: undefined })
      );
      warn.mockReset();
    });

    it.each(["", "BCD", "bcd!", "Shop"])(
      "rejects invalid id '%s'",
      async (bad) => {
        const warn = logger.warn as jest.Mock;
        warn.mockImplementation(() => {});

        const res = await onRequestPost({
          params: { id: bad },
          request: new Request("http://example.com", { method: "POST" }),
        });

        const body = await res.json();
        expect(res.status).toBe(400);
        expect(body).toEqual({ error: "Invalid shop id" });
        expect(warn).toHaveBeenCalledWith(
          "invalid shop id",
          expect.objectContaining({ id: bad })
        );
        warn.mockReset();
      }
    );
  });

  describe("authorization header", () => {
    it.each([undefined, "Token foo"])(
      "rejects missing or malformed header %s",
      async (header) => {
        const warn = logger.warn as jest.Mock;
        warn.mockImplementation(() => {});

        const init: RequestInit = { method: "POST" };
        if (header) init.headers = { Authorization: header };

        const res = await onRequestPost({
          params: { id },
          request: new Request("http://example.com", init),
        });

        const body = await res.json();
        expect(res.status).toBe(401);
        expect(body).toEqual({ error: "Unauthorized" });
        expect(warn).toHaveBeenCalledWith(
          "missing bearer token",
          expect.objectContaining({ id })
        );
        warn.mockReset();
      }
    );
  });

  it("returns 403 for any bearer token when secret missing", async () => {
    const warn = logger.warn as jest.Mock;
    warn.mockImplementation(() => {});

    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: "Bearer any-token" },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(warn).toHaveBeenCalledWith(
      "invalid token",
      expect.objectContaining({ id })
    );
    warn.mockReset();
  });

  it("returns 403 when secret is empty string", async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "";
    const warn = logger.warn as jest.Mock;
    warn.mockImplementation(() => {});
    const verify = jest.spyOn(jwt, "verify");

    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(warn).toHaveBeenCalledWith(
      "invalid token",
      expect.objectContaining({ id })
    );
    expect(verify).not.toHaveBeenCalled();
    warn.mockReset();
    verify.mockRestore();
  });

  it("returns 403 when jwt.verify throws", async () => {
    const warn = logger.warn as jest.Mock;
    warn.mockImplementation(() => {});
    const verify = jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(warn).toHaveBeenCalledWith(
      "invalid token",
      expect.objectContaining({ id })
    );
    warn.mockReset();
    verify.mockRestore();
  });
});
