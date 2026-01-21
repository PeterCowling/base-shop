import { friendlyErrorMap } from "../zodErrorMap.js";

const setErrorMap = jest.fn();

jest.mock("zod", () => ({
  z: { setErrorMap },
}));

jest.mock("../zodErrorMap.js", () => ({
  friendlyErrorMap: jest.fn(() => ({ message: "ok" })),
}));

describe("initZod", () => {
  const orig = process.env.ZOD_ERROR_MAP_OFF;

  afterEach(() => {
    process.env.ZOD_ERROR_MAP_OFF = orig;
    jest.resetModules();
    setErrorMap.mockReset();
    (friendlyErrorMap as jest.Mock).mockClear();
  });

  test("registers friendly error map by default", async () => {
    delete process.env.ZOD_ERROR_MAP_OFF;
    await import("../initZod");
    expect(setErrorMap).toHaveBeenCalledTimes(1);
    const handler = setErrorMap.mock.calls[0][0];
    handler({} as any, { defaultError: "err" });
    expect(friendlyErrorMap).toHaveBeenCalled();
  });

  test("skips when ZOD_ERROR_MAP_OFF=1", async () => {
    process.env.ZOD_ERROR_MAP_OFF = "1";
    await import("../initZod");
    expect(setErrorMap).not.toHaveBeenCalled();
  });
});
