import { run } from "../publish-upgrade";
import { spawn } from "child_process";

jest.mock("child_process", () => ({ spawn: jest.fn() }));

const spawnMock = spawn as unknown as jest.Mock;

describe("run", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("resolves when command exits with code 0", async () => {
    spawnMock.mockReturnValueOnce({
      on: (event: string, cb: any) => {
        if (event === "close") cb(0);
      },
    });

    await expect(run("cmd", ["a"], "/tmp")).resolves.toBeUndefined();
    expect(spawnMock).toHaveBeenCalledWith("cmd", ["a"], {
      cwd: "/tmp",
      stdio: "inherit",
    });
  });

  it("rejects when command exits with non-zero code", async () => {
    spawnMock.mockReturnValueOnce({
      on: (event: string, cb: any) => {
        if (event === "close") cb(1);
      },
    });

    await expect(run("cmd", ["a"], "/tmp")).rejects.toThrow(
      "cmd a failed with status 1",
    );
  });

  it("rejects when an error event is emitted", async () => {
    const err = new Error("fail");
    spawnMock.mockReturnValueOnce({
      on: (event: string, cb: any) => {
        if (event === "error") cb(err);
      },
    });

    await expect(run("cmd", [], "/tmp")).rejects.toBe(err);
  });
});
