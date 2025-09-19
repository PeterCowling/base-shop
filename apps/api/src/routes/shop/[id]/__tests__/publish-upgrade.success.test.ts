import { jest } from "@jest/globals";
import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  defaultShopId,
  jwt,
  loadOnRequestPost,
  mockSuccessfulSpawn,
  readFileSync,
  resetTestState,
  root,
  spawn,
  writeFileSync,
} from "./publish-upgrade.test-helpers";

let onRequestPost: OnRequestPost;
const id = defaultShopId;

beforeAll(async () => {
  onRequestPost = await loadOnRequestPost();
});

beforeEach(() => {
  resetTestState();
});

const authorize = () => {
  process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
  return jwt.sign({}, "secret");
};

describe("onRequestPost success scenarios", () => {
  it("updates selected components and spawns build/deploy", async () => {
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
    );
  });

  it("leaves componentVersions unchanged when all components are unknown and still runs build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
      mockSuccessfulSpawn();

      const token = authorize();
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
        { cwd: root, stdio: "inherit" }
      );
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "deploy"],
        { cwd: root, stdio: "inherit" }
      );
    }
  );

  it.each([
    ["null", null],
    ["number", 123],
    ["boolean", true],
  ])(
    "locks all dependencies and runs build/deploy when body is %s",
    async (_type, rawBody) => {
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
      mockSuccessfulSpawn();

      const token = authorize();
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: rawBody === null ? null : JSON.stringify(rawBody),
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
        { cwd: root, stdio: "inherit" }
      );
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "deploy"],
        { cwd: root, stdio: "inherit" }
      );
    }
  );

  it("locks all dependencies and runs build/deploy when components property is missing", async () => {
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
    );
  });

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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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

    const token = authorize();
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
    mockSuccessfulSpawn();

    const token = authorize();
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
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
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
    mockSuccessfulSpawn();

    const token = authorize();
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

  it.each(['"{bad', "not-json"])(
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
      mockSuccessfulSpawn();

      const token = authorize();
      const res = await onRequestPost({
        params: { id },
        request: new Request("http://example.com", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: badBody,
        }),
      });

      expect(res.status).toBe(200);
      const responseBody = await res.json();
      expect(responseBody).toEqual({ ok: true });
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
        { cwd: root, stdio: "inherit" }
      );
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        "pnpm",
        ["--filter", `apps/shop-${id}`, "deploy"],
        { cwd: root, stdio: "inherit" }
      );
    }
  );
});
