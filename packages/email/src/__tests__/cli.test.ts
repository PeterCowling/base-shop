/** @jest-environment node */
import path from "path";
jest.setTimeout(10000);

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

const sendDueCampaigns = jest.fn();
jest.mock("../scheduler", () => ({ sendDueCampaigns }));

const { resolveDataRoot } = jest.requireActual("../cli") as {
  resolveDataRoot: () => string;
};
const dataRoot = resolveDataRoot();

test("resolveDataRoot falls back to cwd/data/shops", () => {
  expect(dataRoot).toBe(path.resolve(process.cwd(), "data", "shops"));
});

test("resolveDataRoot finds nearest ancestor data/shops", () => {
  const fs = jest.requireActual("fs") as typeof import("fs");
  const os = jest.requireActual("os") as typeof import("os");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-cli-"));
  const ancestor = path.join(tmpDir, "data", "shops");
  fs.mkdirSync(path.join(ancestor, "nested"), { recursive: true });

  const prev = process.cwd();
  fsMock.existsSync.mockImplementation(fs.existsSync);
  try {
    process.chdir(path.join(ancestor, "nested"));
    expect(resolveDataRoot()).toBe(ancestor);
  } finally {
    process.chdir(prev);
    fsMock.existsSync.mockImplementation(() => false);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

const originalArgv = process.argv.slice();

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  fsMock.existsSync.mockImplementation(() => false);
  for (const k of Object.keys(files)) delete files[k];
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
    "a@example.com, , b@example.com ",
    "--send-at",
    "2020-01-01T00:00:00.000Z",
  ];
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../cli");
  await run();

  const campaignsPath = path.join(dataRoot, "shop1", "campaigns.json");
  expect(files[campaignsPath]).toBeDefined();
  const json = JSON.parse(files[campaignsPath]);
  expect(json).toHaveLength(1);
  expect(json[0]).toMatchObject({
    subject: "Hi",
    body: "<p>Hi</p>",
    recipients: ["a@example.com", "b@example.com"],
  });
  expect(typeof json[0].sendAt).toBe("string");
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^Created campaign/));
});

test("campaign create with segment and no recipients", async () => {
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
    "--segment",
    "vip",
    "--send-at",
    "2020-01-01T00:00:00.000Z",
  ];
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../cli");
  await run();

  const campaignsPath = path.join(dataRoot, "shop1", "campaigns.json");
  expect(files[campaignsPath]).toBeDefined();
  const json = JSON.parse(files[campaignsPath]);
  expect(json).toHaveLength(1);
  expect(json[0]).toMatchObject({
    subject: "Hi",
    body: "<p>Hi</p>",
    recipients: [],
    segment: "vip",
  });
  expect(typeof json[0].sendAt).toBe("string");
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^Created campaign/));
});

test("campaign list outputs campaigns", async () => {
  const campaignsPath = path.join(dataRoot, "shop", "campaigns.json");
  const campaigns = [
    {
      id: "c1",
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
      segment: null,
      sendAt: "2020-01-01T00:00:00.000Z",
    },
  ];
  files[campaignsPath] = JSON.stringify(campaigns);

  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../cli");
  await run(["node", "email", "campaign", "list", "shop"]);

  expect(logSpy).toHaveBeenCalledTimes(1);
  const output = logSpy.mock.calls[0][0];
  expect(JSON.parse(output)).toEqual(campaigns);
});

test("campaign list outputs [] when file missing", async () => {
  fsMock.promises.readFile.mockRejectedValueOnce(
    Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
  );
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../cli");
  await run(["node", "email", "campaign", "list", "shop"]);

  expect(fsMock.promises.readFile).toHaveBeenCalledWith(
    path.join(dataRoot, "shop", "campaigns.json"),
    "utf8",
  );
  expect(logSpy).toHaveBeenCalledWith("[]");
});

test("campaign send invokes scheduler", async () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { run } = await import("../cli");
  await run(["node", "email", "campaign", "send"]);
  expect(sendDueCampaigns).toHaveBeenCalled();
  expect(logSpy).toHaveBeenCalledWith("Sent due campaigns");
});

test("campaign send propagates scheduler errors", async () => {
  const error = new Error("nope");
  sendDueCampaigns.mockRejectedValueOnce(error);
  const { run } = await import("../cli");
  await expect(run(["node", "email", "campaign", "send"])).rejects.toBe(error);
});
