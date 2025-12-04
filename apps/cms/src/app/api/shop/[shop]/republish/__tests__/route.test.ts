const requirePermission = jest.fn();
jest.mock("@auth", () => ({ requirePermission }));

const execFile = jest.fn();
jest.mock("child_process", () => ({ execFile }));

const verifyShopAfterDeploy = jest.fn();
const updateDeployStatus = jest.fn();

jest.mock("@cms/actions/verifyShopAfterDeploy.server", () => ({
  __esModule: true,
  verifyShopAfterDeploy: (...args: any[]) =>
    verifyShopAfterDeploy(...args),
}));

jest.mock("@cms/actions/deployShop.server", () => ({
  __esModule: true,
  updateDeployStatus: (...args: any[]) =>
    updateDeployStatus(...args),
}));

let consoleErrorSpy: jest.SpyInstance;
let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("POST /api/shop/[shop]/republish", () => {
  function req() {
    return new Request("http://test");
  }

  it("returns ok and updates deploy status when republish and tests succeed", async () => {
    requirePermission.mockResolvedValue(undefined);
    execFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, { stdout: "", stderr: "" });
    });
    verifyShopAfterDeploy.mockResolvedValue({
      status: "passed",
    });

    const res = await POST(req(), { params: { shop: "shop1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(execFile).toHaveBeenCalled();
    expect(verifyShopAfterDeploy).toHaveBeenCalledWith("shop1", "prod");
    expect(updateDeployStatus).toHaveBeenCalledWith(
      "shop1",
      expect.objectContaining({
        env: "prod",
        testsStatus: "passed",
        lastTestedAt: expect.any(String),
      }),
    );
  });

  it("returns 401 when permission check fails", async () => {
    requirePermission.mockRejectedValue(new Error("nope"));

    const res = await POST(req(), { params: { shop: "shop1" } });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(execFile).not.toHaveBeenCalled();
    expect(updateDeployStatus).not.toHaveBeenCalled();
  });

  it("returns 500 when republish fails", async () => {
    requirePermission.mockResolvedValue(undefined);
    execFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(new Error("republish failed"), { stdout: "", stderr: "" });
    });

    const res = await POST(req(), { params: { shop: "bad" } });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Republish failed" });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(updateDeployStatus).not.toHaveBeenCalled();
  });
});
