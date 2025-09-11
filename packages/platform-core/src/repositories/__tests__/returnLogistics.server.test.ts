import { promises as fs } from "fs";

jest.mock("../../dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/data/root/shops"),
}));

const readFile = jest.fn();

jest.mock("fs", () => ({
  promises: {
    readFile,
  },
}));

import { readReturnLogistics } from "../returnLogistics.server";

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
