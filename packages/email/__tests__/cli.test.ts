/** @jest-environment node */
import path from "path";

const files: Record<string, string> = {};

const fsMock = {
  promises: {
    readFile: jest.fn(async (p: string) => {
      if (!(p in files)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      return files[p];
    }),
    writeFile: jest.fn(async (p: string, data: string) => {
      files[p] = data;
    }),
    mkdir: jest.fn(async () => {}),
  },
  existsSync: jest.fn(() => false),
};

jest.mock("fs", () => fsMock as unknown, { virtual: true });

const { resolveDataRoot } = jest.requireActual("../src/cli") as { resolveDataRoot: () => string };
const dataRoot = resolveDataRoot();

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(files)) delete files[k];
});

test("campaign create stores two recipients", async () => {
  const { run } = await import("../src/cli");
  await run([
    "node",
    "email",
    "campaign",
    "create",
    "shop",
    "--subject",
    "S",
    "--body",
    "<p>b</p>",
    "--recipients",
    "a@b.com,c@d.com",
  ]);
  const campaignsPath = path.join(dataRoot, "shop", "campaigns.json");
  expect(files[campaignsPath]).toBeDefined();
  const json = JSON.parse(files[campaignsPath]);
  expect(json).toHaveLength(1);
  expect(json[0].recipients).toEqual(["a@b.com", "c@d.com"]);
});
