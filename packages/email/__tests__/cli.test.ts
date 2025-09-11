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

const sendDueCampaigns = jest.fn(async () => {});
jest.mock("../src/scheduler", () => ({
  __esModule: true,
  sendDueCampaigns,
}));

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
  expect(fsMock.promises.mkdir).toHaveBeenCalledWith(
    path.join(dataRoot, "shop"),
    { recursive: true },
  );
});

test("campaign list prints stored campaigns", async () => {
  const campaignsPath = path.join(dataRoot, "shop", "campaigns.json");
  files[campaignsPath] = JSON.stringify([{ id: "1" }], null, 2);
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../src/cli");
  await run(["node", "email", "campaign", "list", "shop"]);
  expect(log).toHaveBeenCalledWith(
    JSON.stringify([{ id: "1" }], null, 2),
  );
  log.mockRestore();
});

test.each([
  ["missing file"],
  ["malformed json"],
])("campaign list returns [] when %s", async (_case) => {
  const campaignsPath = path.join(dataRoot, "shop", "campaigns.json");
  if (_case === "malformed json") files[campaignsPath] = "{";
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../src/cli");
  await run(["node", "email", "campaign", "list", "shop"]);
  expect(log).toHaveBeenCalledWith("[]");
  log.mockRestore();
});

test("campaign send invokes scheduler", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../src/cli");
  await run(["node", "email", "campaign", "send"]);
  expect(sendDueCampaigns).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith("Sent due campaigns");
  log.mockRestore();
});
