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

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("launch-shop API", () => {
  it("returns 400 when required steps are incomplete", async () => {
    const { POST } = await import("../src/app/api/launch-shop/route");
    const req = {
      json: async () => ({
        shopId: "shop",
        state: { completed: {} },
      }),
    } as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Array.isArray(json.missingSteps)).toBe(true);
    expect(json.missingSteps.length).toBeGreaterThan(0);
  });
});
