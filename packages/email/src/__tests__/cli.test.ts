/** @jest-environment node */
import path from "path";

const files: Record<string, string> = {};
const dirs = new Set<string>();

const fsMock = {
  promises: {
    readFile: jest.fn(async (p: string) => {
      if (!(p in files)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      return files[p];
    }),
    writeFile: jest.fn(async (p: string, data: string) => {
      files[p] = data;
    }),
    mkdir: jest.fn(async (p: string) => {
      dirs.add(p);
    }),
  },
  existsSync: jest.fn((p: string) => dirs.has(p)),
};

jest.mock("fs", () => fsMock as unknown, { virtual: true });

const sendDueCampaigns = jest.fn();
jest.mock("../scheduler", () => ({ sendDueCampaigns }));

const realFs = jest.requireActual("fs") as typeof import("fs");
function computeDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (realFs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}
const dataRoot = computeDataRoot();

const originalArgv = process.argv.slice();

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  for (const k of Object.keys(files)) delete files[k];
  dirs.clear();
  dirs.add(dataRoot);
  process.argv = [...originalArgv];
});

test("campaign create writes campaign file", async () => {
  process.argv = [
    "node",
    "email",
    "campaign",
    "create",
    "shop1",
    "--subject",
    "Hi",
    "--body",
    "<p>Hi</p>",
    "--recipients",
    "a@example.com",
    "--send-at",
    "2020-01-01T00:00:00.000Z",
  ];
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  await import("../cli");
  await new Promise((r) => setImmediate(r));

  const campaignsPath = path.join(dataRoot, "shop1", "campaigns.json");
  expect(files[campaignsPath]).toBeDefined();
  const json = JSON.parse(files[campaignsPath]);
  expect(json).toHaveLength(1);
  expect(json[0]).toMatchObject({
    subject: "Hi",
    body: "<p>Hi</p>",
    recipients: ["a@example.com"],
  });
  expect(typeof json[0].sendAt).toBe("string");
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^Created campaign/));
});

test("campaign list outputs campaigns", async () => {
  const campaignsPath = path.join(dataRoot, "shop1", "campaigns.json");
  files[campaignsPath] = JSON.stringify([
    {
      id: "c1",
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
      segment: null,
      sendAt: "2020-01-01T00:00:00.000Z",
    },
  ]);

  process.argv = ["node", "email", "campaign", "list", "shop1"];
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  await import("../cli");
  await new Promise((r) => setImmediate(r));

  expect(logSpy).toHaveBeenCalledTimes(1);
  const output = logSpy.mock.calls[0][0];
  expect(JSON.parse(output)).toEqual(JSON.parse(files[campaignsPath]));
});

test("campaign send invokes scheduler", async () => {
  process.argv = ["node", "email", "campaign", "send"];
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  await import("../cli");
  await new Promise((r) => setImmediate(r));
  expect(sendDueCampaigns).toHaveBeenCalled();
  expect(logSpy).toHaveBeenCalledWith("Sent due campaigns");
});
