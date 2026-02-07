import * as childProcess from "child_process";

import { run } from "../../../../src/routes/shop/[id]/publish-upgrade";

jest.mock("child_process");

describe("run", () => {
  it("rejects when process exits non-zero", async () => {
    (childProcess.spawn as jest.Mock).mockImplementation(
      () =>
        ({
          on: (ev, cb) => {
            if (ev === "close") cb(1);
            return undefined as any;
          },
        }) as any,
    );

    await expect(run("pnpm", ["test"], "/tmp")).rejects.toThrow(
      "pnpm test failed with status 1",
    );
  });
});
