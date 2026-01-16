import fs from "fs/promises";
import { mkdtempSync } from "fs";
import os from "os";
import path from "path";

jest.mock("../common/auth", () => ({ ensureAuthorized: jest.fn() }));

const tmpDir = mkdtempSync(path.join(os.tmpdir(), "deploy-status-"));

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => tmpDir,
}));

import { updateDeployStatus } from "../deployShop.server";

jest.setTimeout(30000);

describe("updateDeployStatus concurrency", () => {
  it("merges concurrent updates without corrupting file", async () => {
    await Promise.all([
      updateDeployStatus("shop", { domainStatus: "ready" }),
      updateDeployStatus("shop", { certificateStatus: "valid" }),
    ]);

    const file = path.join(tmpDir, "shop", "deploy.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DEV-000: test uses controlled temp path; no user input
    const content = await fs.readFile(file, "utf8");
    expect(JSON.parse(content)).toEqual({
      domainStatus: "ready",
      certificateStatus: "valid",
    });
  });
});
