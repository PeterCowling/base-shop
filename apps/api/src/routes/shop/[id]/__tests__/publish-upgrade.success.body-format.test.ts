import {
  expectBuildAndDeployForShop,
  expectComponentsWritten,
  mockPackageState,
  postUpgrade,
} from "./publish-upgrade.success.test-utils";
import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  defaultShopId,
  loadOnRequestPost,
  mockSuccessfulSpawn,
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

describe("onRequestPost request body formats", () => {
  it("locks all dependencies and runs build/deploy when JSON body is malformed", async () => {
    mockPackageState({
      packageJson: {
        dependencies: { compA: "1.0.0", compB: "2.0.0" },
      },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      rawBody: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    expectComponentsWritten(id, {
      compA: "1.0.0",
      compB: "2.0.0",
    });
    expectBuildAndDeployForShop(id);
  });

  it("locks all dependencies and returns ok when body is plain text", async () => {
    mockPackageState({
      packageJson: {
        dependencies: { compA: "1.0.0", compB: "2.0.0" },
      },
    });
    mockSuccessfulSpawn();

    const res = await postUpgrade(onRequestPost, id, {
      rawBody: "not-json",
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expectComponentsWritten(id, {
      compA: "1.0.0",
      compB: "2.0.0",
    });
  });

  it.each(['"{bad', "not-json"])(
    "locks all dependencies and runs build/deploy when body is invalid JSON",
    async (badBody) => {
      mockPackageState({
        packageJson: {
          dependencies: { compA: "1.0.0", compB: "2.0.0" },
        },
      });
      mockSuccessfulSpawn();

      const res = await postUpgrade(onRequestPost, id, {
        rawBody: badBody,
      });

      expect(res.status).toBe(200);
      const responseBody = await res.json();
      expect(responseBody).toEqual({ ok: true });
      expectComponentsWritten(id, {
        compA: "1.0.0",
        compB: "2.0.0",
      });
      expectBuildAndDeployForShop(id);
    }
  );
});
