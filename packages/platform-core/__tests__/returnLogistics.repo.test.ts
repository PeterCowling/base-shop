/** @jest-environment node */
import { promises as fs } from "node:fs";
import path from "node:path";

describe("returnLogistics json repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("rejects when fs.readFile returns invalid JSON", async () => {
    const root = "/tmp/shops";
    jest.doMock("../src/dataRoot", () => ({ resolveDataRoot: () => root }));
    const { jsonReturnLogisticsRepository } = await import(
      "../src/repositories/returnLogistics.json.server"
    );
    const spy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("not-json" as unknown as Buffer);

    await expect(
      jsonReturnLogisticsRepository.readReturnLogistics()
    ).rejects.toThrow();

    const file = path.join(root, "..", "return-logistics.json");
    expect(spy).toHaveBeenCalledWith(file, "utf8");
  });

  it("writes via a temp file then renames", async () => {
    const root = "/tmp/shops";
    jest.doMock("../src/dataRoot", () => ({ resolveDataRoot: () => root }));
    const { jsonReturnLogisticsRepository } = await import(
      "../src/repositories/returnLogistics.json.server"
    );
    const mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
    const writeSpy = jest
      .spyOn(fs, "writeFile")
      .mockResolvedValue(undefined as any);
    const renameSpy = jest
      .spyOn(fs, "rename")
      .mockResolvedValue(undefined as any);
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(42);

    const data = { foo: "bar" } as any;
    await jsonReturnLogisticsRepository.writeReturnLogistics(data);

    const file = path.join(root, "..", "return-logistics.json");
    const tmp = `${file}.42.tmp`;
    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname(file), {
      recursive: true,
    });
    expect(writeSpy).toHaveBeenCalledWith(
      tmp,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    expect(renameSpy).toHaveBeenCalledWith(tmp, file);
    nowSpy.mockRestore();
  });
});

