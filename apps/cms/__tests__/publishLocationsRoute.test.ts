import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

jest.setTimeout(20000);


// Using shared helper to create temp data repo

describe("publish locations API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns file contents", async () => {
    await withTempRepo(async (dir) => {
      const locations = [
        {
          id: "hero",
          name: "Hero",
          path: "hero",
          requiredOrientation: "landscape",
        },
      ];
      const file = path.join(dir, "data", "publish-locations.json");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test uses a temp path
      await fs.writeFile(file, JSON.stringify(locations), "utf8");

      const route = await import("../src/app/api/publish-locations/route");
      const res = await route.GET();
      const json = await res.json();
      expect(json).toEqual(locations);
    });
  });

  it("returns 404 when readFile fails", async () => {
    await withTempRepo(async () => {
      jest.doMock("node:fs", () => {
        const actual = jest.requireActual("node:fs");
        return {
          ...actual,
          promises: {
            ...actual.promises,
            readFile: jest.fn().mockRejectedValue(new Error("boom")),
          },
        } as typeof actual;
      });
      const route = await import("../src/app/api/publish-locations/route");
      const res = await route.GET();
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json).toEqual({ error: "boom" });
    });
  });
});
