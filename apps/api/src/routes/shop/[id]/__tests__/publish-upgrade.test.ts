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
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
});

describe("onRequestPost", () => {
  describe("id validation", () => {
    it("rejects missing id", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation();
      const res = await onRequestPost({
        params: {} as any,
        request: new Request("http://example.com", { method: "POST" }),
      });
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Invalid shop id" });
      expect(warn).toHaveBeenCalledWith("invalid shop id", { id: undefined });
      warn.mockRestore();
    });

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

  it("returns 403 for any bearer token when secret missing", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
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
    expect(warn).toHaveBeenCalledWith("invalid token", { id });
    warn.mockRestore();
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
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

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

  it("deduplicates components and spawns build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA", "compA"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [shopPath, data] = writeFileSync.mock.calls[0];
    expect(shopPath).toContain(`data/shops/${id}/shop.json`);
    const written = JSON.parse(data as string);
    expect(written.componentVersions).toEqual({ compA: "1.0.0" });
    expect(Object.keys(written.componentVersions)).toHaveLength(1);
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

  it("creates componentVersions when missing and spawns build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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

  it("ignores missing components and still runs build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA", "missing"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(writeFileSync.mock.calls[0][1] as string);
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

  it(
    "leaves componentVersions unchanged when all components are unknown and still runs build/deploy",
    async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["unknown"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(writeFileSync.mock.calls[0][1] as string);
    expect(written.componentVersions).toEqual({});
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

  it.each([
    ["object", {}],
    ["string", "not-an-array"],
  ])(
    "locks all dependencies and runs build/deploy when components is a %s",
    async (_type, components) => {
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
        on: (event: string, cb: any) => { if (event === "close") cb(0); },
      }));

      process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


      const token = jwt.sign({}, "secret");
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ components }),
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
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

  it(
    "locks all dependencies and runs build/deploy when components property is missing",
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
        on: (event: string, cb: any) => { if (event === "close") cb(0); },
      }));

      process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


      const token = jwt.sign({}, "secret");
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ other: true }),
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

  it("locks all dependencies and runs build/deploy when components is an empty array", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: [] }),
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

  it("returns 200 and skips build/deploy when package.json has no dependencies", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({});
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: { compA: "1.0.0" } });
      }
      return "";
    });
    spawn.mockImplementation(() => ({
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

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
    const written = JSON.parse(writeFileSync.mock.calls[0][1] as string);
    expect(written.componentVersions).toEqual({ compA: "1.0.0" });
    expect(spawn).not.toHaveBeenCalled();
  });

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
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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

  it("locks all dependencies and runs build/deploy when JSON body is malformed", async () => {
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
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "not-json",
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
  });

  it("locks all dependencies and returns ok when body is plain text", async () => {
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
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: "not-json",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(writeFileSync.mock.calls[0][1] as string);
    expect(written.componentVersions).toEqual({
      compA: "1.0.0",
      compB: "2.0.0",
    });
    expect(typeof written.lastUpgrade).toBe("string");
  });

  it.each(["\"{bad", "not-json"])(
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
        on: (event: string, cb: any) => { if (event === "close") cb(0); },
      }));

      process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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
      const body = await res.json();
      expect(body).toEqual({ ok: true });
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
      on: (event: string, cb: any) => { if (event === "close") cb(1); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith(
      "pnpm",
      ["--filter", `apps/shop-${id}`, "build"],
      { cwd: root, stdio: "inherit" },
    );
    expect(spawn).not.toHaveBeenCalledWith(
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" },
    );
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
        on: (event: string, cb: any) => { if (event === "close") cb(0); },
      }))
      .mockImplementationOnce(() => ({
        on: (event: string, cb: any) => { if (event === "close") cb(1); },
      }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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
      on: (event: string, cb: any) => { if (event === "close") cb(0); },
    }));

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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

  it("returns 500 when reading shop file fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        throw new Error("cannot read");
      }
      return "";
    });
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
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
    expect(body).toEqual({ error: "cannot read" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when shop file cannot be parsed", async () => {
    const invalid = "not-json";
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return invalid;
      }
      return "";
    });

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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
    let parseMessage = "";
    try {
      JSON.parse(invalid);
    } catch (err) {
      parseMessage = err instanceof Error ? err.message : String(err);
    }

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: parseMessage });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when package.json cannot be read", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        const err = new Error("missing package.json") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      }
      return "";
    });
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
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
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when a dependency throws a string", async () => {
    readFileSync.mockImplementation(() => {
      throw "boom";
    });

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
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
    expect(body).toEqual({ error: "boom" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return "not-json";
      }
      return "";
    });

    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";


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

