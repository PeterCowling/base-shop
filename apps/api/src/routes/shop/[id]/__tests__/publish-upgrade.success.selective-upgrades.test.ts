import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  defaultShopId,
  loadOnRequestPost,
  mockSuccessfulSpawn,
  resetTestState,
  spawn,
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

describe("onRequestPost selective upgrade scenarios", () => {
  it("updates selected components and spawns build/deploy", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0", compB: "2.0.0" } },
      shopJson: { componentVersions: {} },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["compA"] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, { compA: "1.0.0" });
    expectBuildAndDeployForShop(id);
  });

  it("deduplicates components and spawns build/deploy", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0" } },
      shopJson: { componentVersions: {} },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["compA", "compA"] },
    });

    expect(res.status).toBe(200);
    const written = expectComponentsWritten(id, { compA: "1.0.0" });
    expect(Object.keys(written.componentVersions)).toHaveLength(1);
    expectBuildAndDeployForShop(id);
  });

  it("creates componentVersions when missing and spawns build/deploy", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0" } },
      shopJson: {},
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["compA"] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, { compA: "1.0.0" });
    expectBuildAndDeployForShop(id);
  });

  it("ignores missing components and still runs build/deploy", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0" } },
      shopJson: { componentVersions: {} },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["compA", "missing"] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, { compA: "1.0.0" });
    expectBuildAndDeployForShop(id);
  });

  it("leaves componentVersions unchanged when all components are unknown and still runs build/deploy", async () => {
    mockPackageState({
      packageJson: { dependencies: { compA: "1.0.0" } },
      shopJson: { componentVersions: {} },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["unknown"] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, {});
    expectBuildAndDeployForShop(id);
  });

  it("returns 200 and skips build/deploy when package.json has no dependencies", async () => {
    mockPackageState({
      packageJson: {},
      shopJson: { componentVersions: { compA: "1.0.0" } },
    });

    const res = await postUpgrade(onRequestPost, id, {
      body: { components: ["compA"] },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, { compA: "1.0.0" });
    expect(spawn).not.toHaveBeenCalled();
  });
});
