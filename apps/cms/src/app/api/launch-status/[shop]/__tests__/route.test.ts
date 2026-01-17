import type { LaunchCheckResult } from "@acme/types";

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const setSession = (session: any) => {
  const { __setMockSession } = require("next-auth") as {
    __setMockSession: (s: any) => void;
  };
  __setMockSession(session);
};

const mockGetLaunchStatus = jest.fn<
  Promise<LaunchCheckResult>,
  [import("@acme/types").LaunchEnv, string]
>();

jest.mock("@acme/platform-core/configurator", () => ({
  getLaunchStatus: (...args: unknown[]) =>
    mockGetLaunchStatus(
      args[0] as import("@acme/types").LaunchEnv,
      args[1] as string,
    ),
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

const makeRequest = () =>
  new Request("http://test.local/cms/api/launch-status/demo", {
    method: "GET",
  });

describe("GET /cms/api/launch-status/[shop]", () => {
  it("responds 403 when unauthorized", async () => {
    setSession(null);
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns launch status for all environments", async () => {
    setSession({ user: { role: "admin" } });
    mockGetLaunchStatus.mockImplementation(
      async (env, shopId): Promise<LaunchCheckResult> => ({
        env,
        status: "ok",
        reasons: [`shop:${shopId}`],
      }),
    );

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shopId: string;
      environments: LaunchCheckResult[];
    };
    expect(body.shopId).toBe("demo");
    expect(body.environments).toHaveLength(3);
    const envs = body.environments.map((e) => e.env).sort();
    expect(envs).toEqual(["dev", "prod", "stage"]);
  });

  it("returns 400 when getLaunchStatus throws", async () => {
    setSession({ user: { role: "ShopAdmin" } });
    mockGetLaunchStatus.mockRejectedValueOnce(new Error("boom"));

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "boom" });
  });
});
