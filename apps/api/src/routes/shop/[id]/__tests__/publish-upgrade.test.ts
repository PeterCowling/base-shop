import { jest } from "@jest/globals";
import path from "path";
import jwt from "jsonwebtoken";

const readFileSync = jest.fn();
const writeFileSync = jest.fn();
jest.mock("fs", () => ({ readFileSync, writeFileSync }));

const spawn = jest.fn();
jest.mock("child_process", () => ({ spawn }));

let onRequestPost: typeof import("../publish-upgrade").onRequestPost;
const root = path.resolve(__dirname, "..", "../../../../../..");
const id = "test-shop";

beforeAll(async () => {
  ({ onRequestPost } = await import("../publish-upgrade"));
});

beforeEach(() => {
  readFileSync.mockReset();
  writeFileSync.mockReset();
  spawn.mockReset();
  process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
});

describe("onRequestPost", () => {
  describe("id validation", () => {
    it.each(["", "ABC", "abc!", "Shop"])(
      "rejects invalid id '%s'",
      async (bad) => {
        const warn = jest.spyOn(console, "warn").mockImplementation();
        const res = await onRequestPost({
          params: { id: bad },
          request: new Request("http://example.com", { method: "POST" }),
        });
        const body = await res.json();
        expect(res.status).toBe(400);
        expect(body).toEqual({ error: "Invalid shop id" });
        expect(warn).toHaveBeenCalledWith("invalid shop id", { id: bad });
        warn.mockRestore();
      },
    );
  });

  describe("authorization header", () => {
    it.each([undefined, "Token foo"])(
      "rejects missing or malformed header %s",
      async (header) => {
        const warn = jest.spyOn(console, "warn").mockImplementation();
        const init: RequestInit = { method: "POST" };
        if (header) init.headers = { Authorization: header };
        const res = await onRequestPost({
          params: { id },
          request: new Request("http://example.com", init),
        });
        const body = await res.json();
        expect(res.status).toBe(401);
        expect(body).toEqual({ error: "Unauthorized" });
        expect(warn).toHaveBeenCalledWith("missing bearer token", { id });
        warn.mockRestore();
      },
    );
  });

  it("returns 403 when jwt.verify throws", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
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
    expect(warn).toHaveBeenCalledWith("invalid token", { id });
    warn.mockRestore();
    verify.mockRestore();
  });

  it("updates selected components and spawns build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0", compB: "2.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (_: string, cb: (code: number) => void) => cb(0),
    }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [shopPath, data] = writeFileSync.mock.calls[0];
    expect(shopPath).toContain(`data/shops/${id}/shop.json`);
    const written = JSON.parse(data as string);
    expect(written.componentVersions).toEqual({ compA: "1.0.0" });
    expect(typeof written.lastUpgrade).toBe("string");
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "build"],
      { cwd: root, stdio: "inherit" },
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" },
    );
  });

  it("ignores unknown components and still runs build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { known: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (_: string, cb: (code: number) => void) => cb(0),
    }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["known", "unknown"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(writeFileSync.mock.calls[0][1] as string);
    expect(written.componentVersions).toEqual({ known: "1.0.0" });
    expect(typeof written.lastUpgrade).toBe("string");
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "build"],
      { cwd: root, stdio: "inherit" },
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" },
    );
  });

  it(
    "locks all dependencies and runs build/deploy when components is not an array",
    async () => {
      readFileSync.mockImplementation((file: string) => {
        if (file.endsWith("package.json")) {
          return JSON.stringify({
            dependencies: { compA: "1.0.0", compB: "2.0.0" },
          });
        }
        if (file.endsWith("shop.json")) {
          return JSON.stringify({ componentVersions: {} });
        }
        return "";
      });
      spawn.mockImplementation(() => ({
        on: (_: string, cb: (code: number) => void) => cb(0),
      }));

      const token = jwt.sign({}, "secret");
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ components: "foo" }),
        }),
      });

      expect(res.status).toBe(200);
      expect(writeFileSync).toHaveBeenCalledTimes(1);
      const [shopPath, data] = writeFileSync.mock.calls[0];
      expect(shopPath).toContain(`data/shops/${id}/shop.json`);
      const written = JSON.parse(data as string);
      expect(written.componentVersions).toEqual({
        compA: "1.0.0",
        compB: "2.0.0",
      });
      expect(typeof written.lastUpgrade).toBe("string");
      expect(spawn).toHaveBeenNthCalledWith(
        1,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "build"],
        { cwd: root, stdio: "inherit" },
      );
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "deploy"],
        { cwd: root, stdio: "inherit" },
      );
    },
  );

  it("locks all dependencies and runs build/deploy when body is empty", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({
          dependencies: { compA: "1.0.0", compB: "2.0.0", compC: "3.0.0" },
        });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (_: string, cb: (code: number) => void) => cb(0),
    }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [shopPath, data] = writeFileSync.mock.calls[0];
    expect(shopPath).toContain(`data/shops/${id}/shop.json`);
    const written = JSON.parse(data as string);
    expect(written.componentVersions).toEqual({
      compA: "1.0.0",
      compB: "2.0.0",
      compC: "3.0.0",
    });
    expect(typeof written.lastUpgrade).toBe("string");
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "build"],
      { cwd: root, stdio: "inherit" },
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" },
    );
  });

  it.each(["not-json", "\"{bad"])(
    "locks all dependencies and runs build/deploy when body is invalid JSON",
    async (badBody) => {
      readFileSync.mockImplementation((file: string) => {
        if (file.endsWith("package.json")) {
          return JSON.stringify({
            dependencies: { compA: "1.0.0", compB: "2.0.0" },
          });
        }
        if (file.endsWith("shop.json")) {
          return JSON.stringify({ componentVersions: {} });
        }
        return "";
      });
      spawn.mockImplementation(() => ({
        on: (_: string, cb: (code: number) => void) => cb(0),
      }));

      const token = jwt.sign({}, "secret");
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: badBody,
        }),
      });

      expect(res.status).toBe(200);
      expect(writeFileSync).toHaveBeenCalledTimes(1);
      const [shopPath, data] = writeFileSync.mock.calls[0];
      expect(shopPath).toContain(`data/shops/${id}/shop.json`);
      const written = JSON.parse(data as string);
      expect(written.componentVersions).toEqual({
        compA: "1.0.0",
        compB: "2.0.0",
      });
      expect(typeof written.lastUpgrade).toBe("string");
      expect(spawn).toHaveBeenNthCalledWith(
        1,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "build"],
        { cwd: root, stdio: "inherit" },
      );
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "deploy"],
        { cwd: root, stdio: "inherit" },
      );
    },
  );

  it("returns 500 when build command fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementationOnce(() => ({
      on: (_: string, cb: (code: number) => void) => cb(1),
    }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: `pnpm --filter apps/shop-${id} build failed with status 1`,
    });
  });

  it("returns 500 when deploy command fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn
      .mockImplementationOnce(() => ({
        on: (_: string, cb: (code: number) => void) => cb(0),
      }))
      .mockImplementationOnce(() => ({
        on: (_: string, cb: (code: number) => void) => cb(1),
      }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: `pnpm --filter apps/shop-${id} deploy failed with status 1`,
    });
  });

  it("returns 500 when writing shop file fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    writeFileSync.mockImplementation(() => {
      throw new Error("disk full");
    });
    spawn.mockImplementation(() => ({
      on: (_: string, cb: (code: number) => void) => cb(0),
    }));

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "disk full" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return "not-json";
      }
      return "";
    });

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: expect.any(String) });
  });
});

