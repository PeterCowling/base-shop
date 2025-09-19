import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  defaultShopId,
  loadOnRequestPost,
  mockSuccessfulSpawn,
  resetTestState,
} from "./publish-upgrade.test-helpers";
import {
  expectBuildAndDeployForShop,
  expectComponentsWritten,
  mockPackageState,
  postUpgrade,
} from "./publish-upgrade.success.test-utils";

let onRequestPost: OnRequestPost;
const id = defaultShopId;

beforeAll(async () => {
  onRequestPost = await loadOnRequestPost();
});

beforeEach(() => {
  resetTestState();
});

describe("onRequestPost invalid component input", () => {
  it.each([
    ["object", {}],
    ["string", "not-an-array"],
  ])(
    "locks all dependencies and runs build/deploy when components is a %s",
    async (_type, components) => {
      mockPackageState({
        packageJson: {
          dependencies: { compA: "1.0.0", compB: "2.0.0" },
        },
      });
      mockSuccessfulSpawn();

      const res = await postUpgrade(onRequestPost, id, {
        body: { components },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
      expectComponentsWritten(id, {
        compA: "1.0.0",
        compB: "2.0.0",
      });
      expectBuildAndDeployForShop(id);
    }
  );

  it.each([
    ["null", null],
    ["number", 123],
    ["boolean", true],
  ])(
    "locks all dependencies and runs build/deploy when body is %s",
    async (_type, rawBody) => {
      mockPackageState({
        packageJson: {
          dependencies: { compA: "1.0.0", compB: "2.0.0" },
        },
      });
      mockSuccessfulSpawn();

      const res = await postUpgrade(onRequestPost, id, {
        rawBody: rawBody === null ? null : JSON.stringify(rawBody),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
      expectComponentsWritten(id, {
        compA: "1.0.0",
        compB: "2.0.0",
      });
      expectBuildAndDeployForShop(id);
    }
  );

  it("locks all dependencies and runs build/deploy when components property is missing", async () => {
    mockPackageState({
      packageJson: {
        dependencies: { compA: "1.0.0", compB: "2.0.0" },
      },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { other: true },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, {
      compA: "1.0.0",
      compB: "2.0.0",
    });
    expectBuildAndDeployForShop(id);
  });

  it("locks all dependencies and runs build/deploy when components is an empty array", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0" } },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: [] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, { compA: "1.0.0" });
    expectBuildAndDeployForShop(id);
  });

  it("locks all dependencies and runs build/deploy when body is empty", async () => {
    mockPackageState({
      packageJson: {
        dependencies: {
          compA: "1.0.0",
          compB: "2.0.0",
          compC: "3.0.0",
        },
      },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: {},
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, {
      compA: "1.0.0",
      compB: "2.0.0",
      compC: "3.0.0",
    });
    expectBuildAndDeployForShop(id);
  });
});
