import { run } from "../../../../src/routes/shop/[id]/publish-upgrade";
import * as childProcess from "child_process";

jest.mock("child_process");

describe("run", () => {
  it("rejects when process exits non-zero", async () => {
    (childProcess.spawn as jest.Mock).mockImplementation(
      () =>
        ({
          on: (_ev, cb) => {
            cb(1);
            return undefined as any;
          },
        }) as any,
    );

    await expect(run("pnpm", ["test"], "/tmp")).rejects.toThrow(
      "pnpm test failed with status 1",
    );
  });
});
