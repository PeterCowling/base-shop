import os from "os";
import path from "path";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: jest.fn(),
}));

jest.mock("@cms/lib/server/rbacStore", () => ({
  readRbac: jest.fn(),
}));

import { collectStats, buildQuickStats } from "../dashboardData";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { readRbac } from "@cms/lib/server/rbacStore";

describe("collectStats", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "dashboard-data-"));
    (resolveDataRoot as jest.Mock).mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    jest.resetAllMocks();
  });

  it("counts shops, products, and users", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Safe temp fixture path derived from mkdtemp()
    await mkdir(path.join(tempDir, "alpha"), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Safe temp fixture path derived from mkdtemp()
    await mkdir(path.join(tempDir, "beta"), { recursive: true });

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Safe temp fixture path derived from mkdtemp()
    await writeFile(
      path.join(tempDir, "alpha", "products.json"),
      JSON.stringify([{ id: 1 }, { id: 2 }])
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Safe temp fixture path derived from mkdtemp()
    await writeFile(
      path.join(tempDir, "beta", "products.json"),
      JSON.stringify([{ id: 3 }])
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Safe temp fixture path derived from mkdtemp()
    await writeFile(path.join(tempDir, "notes.txt"), "ignore me");

    (readRbac as jest.Mock).mockResolvedValue({
      users: {
        "user-1": {},
        "user-2": {},
      },
    });

    const stats = await collectStats();

    expect(stats).toEqual({
      users: 2,
      shops: 2,
      products: 3,
    });
  });
});

describe("buildQuickStats", () => {
  it("formats zero values with onboarding guidance", () => {
    expect(buildQuickStats({ users: 0, shops: 0, products: 0 })).toEqual([
      {
        label: "Active users",
        value: "0",
        caption: "Invite teammates to collaborate",
      },
      {
        label: "Live shops",
        value: "0",
        caption: "Create your first shop to go live",
      },
      {
        label: "Catalog size",
        value: "0",
        caption: "No products imported yet",
      },
    ]);
  });

  it("pluralises captions for populated workspaces", () => {
    expect(buildQuickStats({ users: 1, shops: 2, products: 3 })).toEqual([
      {
        label: "Active users",
        value: "1",
        caption: "person with workspace access",
      },
      {
        label: "Live shops",
        value: "2",
        caption: "storefronts active",
      },
      {
        label: "Catalog size",
        value: "3",
        caption: "products across all shops",
      },
    ]);
  });
});
