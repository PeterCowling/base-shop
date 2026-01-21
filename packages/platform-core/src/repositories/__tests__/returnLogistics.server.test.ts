import { promises as fs } from "fs";

import { createReturnLabel,readReturnLogistics } from "../returnLogistics.server";

jest.mock("../../dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/data/root/shops"),
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const readFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

describe("return logistics repository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throws not found error when file is missing", async () => {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    readFile.mockRejectedValueOnce(err);
    await expect(readReturnLogistics()).rejects.toThrow("not found");
  });

  it("throws on invalid JSON data", async () => {
    readFile.mockResolvedValueOnce("{}");
    await expect(readReturnLogistics()).rejects.toThrow(
      "Invalid return logistics data",
    );
  });
});

describe("createReturnLabel", () => {
  it("rejects unsupported carrier", async () => {
    await expect(
      createReturnLabel({ carrier: "???", method: "pickup", orderId: "o1" } as any),
    ).rejects.toThrow(/unsupported/i);
  });

  it("creates label for supported carrier", async () => {
    const out = await createReturnLabel({
      carrier: "UPS",
      method: "dropoff",
      orderId: "o1",
    } as any);
    expect(out.labelUrl).toMatch(/ups|label|http/i);
  });
});
