const requirePermission = jest.fn();
jest.mock("@acme/auth", () => ({ requirePermission }));

const execFile = jest.fn();
jest.mock("child_process", () => ({ execFile }));

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

describe("POST", () => {
  function req() {
    return new Request("http://test");
  }

  it("returns ok when rollback succeeds", async () => {
    requirePermission.mockResolvedValue(undefined);
    execFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, { stdout: "", stderr: "" });
    });

    const res = await POST(req(), { params: { shop: "shop1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(execFile).toHaveBeenCalled();
  });

  it("returns 500 when rollback fails for invalid diff ID", async () => {
    requirePermission.mockResolvedValue(undefined);
    execFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(new Error("Invalid diff ID"), { stdout: "", stderr: "" });
    });

    const res = await POST(req(), { params: { shop: "bad" } });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Rollback failed" });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
