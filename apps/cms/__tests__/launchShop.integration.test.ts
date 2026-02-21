import { jest } from "@jest/globals";

jest.mock("../src/app/cms/configurator/steps", () => {
  const steps = [
    { id: "a", label: "A", component: () => null },
    { id: "b", label: "B", component: () => null },
  ];
  return {
    __esModule: true,
    getRequiredSteps: () => steps,
  };
});

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: (name: string) => (name === "csrf_token" ? { value: "token" } : undefined),
  })),
}));

jest.mock("@cms/actions/common/auth", () => ({
  __esModule: true,
  ensureAuthorized: () => Promise.resolve({ user: { id: "test-user" } }),
}));

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("launch-shop API", () => {
  // Dynamic import triggers a large module graph; increase timeout for when
  // this test runs alongside many other tests in the same process.
  it("returns 400 when required steps are incomplete", async () => {
    const { POST } = await import("../src/app/api/launch-shop/route");
    const req = {
      json: async () => ({
        shopId: "shop",
        state: { completed: {} },
      }),
      headers: new Headers({ "x-csrf-token": "token" }),
    } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Array.isArray(json.missingSteps)).toBe(true);
    expect(json.missingSteps.length).toBeGreaterThan(0);
  }, 30000);
});
