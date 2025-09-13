jest.mock("cross-fetch", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));

describe("scripts/migrate-cms", () => {
  beforeEach(() => {
    jest.resetModules();
    process.exit = jest.fn() as any;
    const fetchMock = require("cross-fetch").default as jest.Mock;
    const { readFile } = require("node:fs/promises");
    fetchMock.mockReset();
    readFile.mockReset();
  });

  it("pushes schemas with correct request", async () => {
    const fetchMock = require("cross-fetch").default as jest.Mock;
    const { readFile } = require("node:fs/promises");
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CMS_SPACE_URL = "https://cms.example.com";
    process.env.CMS_ACCESS_TOKEN = "token";

    readFile
      .mockResolvedValueOnce('{"page":1}')
      .mockResolvedValueOnce('{"shop":1}');
    fetchMock.mockResolvedValue({ ok: true, text: jest.fn(), status: 200 });

    await import("../../../scripts/migrate-cms");
    await new Promise(process.nextTick);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.com/schemas/page",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: '{"page":1}',
      })
    );
  });
});
