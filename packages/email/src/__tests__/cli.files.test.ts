/** @jest-environment node */
import path from "path";

// Simple in-memory file system
const files: Record<string, string> = {};

const fsMock = {
  promises: {
    readFile: jest.fn(async (p: string) => {
      if (!(p in files)) {
        const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
        throw err;
      }
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

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  for (const k of Object.keys(files)) delete files[k];
});

test("readCampaigns resolves [] when file missing", async () => {
  const { readCampaigns } = await import("../cli");
  await expect(readCampaigns("shop")).resolves.toEqual([]);
});

test("readCampaigns resolves [] on malformed JSON", async () => {
  const { readCampaigns, resolveDataRoot } = await import("../cli");
  const campaignsPath = path.join(resolveDataRoot(), "shop", "campaigns.json");
  files[campaignsPath] = "{not valid";
  await expect(readCampaigns("shop")).resolves.toEqual([]);
});

test("read/write round trip persists campaigns", async () => {
  const { readCampaigns, writeCampaigns, resolveDataRoot } = await import("../cli");
  const campaignsPath = path.join(resolveDataRoot(), "shop", "campaigns.json");
  const campaign = {
    id: "1",
    recipients: [],
    subject: "Hi",
    body: "<p>Hi</p>",
    segment: null,
    sendAt: "2020-01-01T00:00:00.000Z",
  };
  await expect(readCampaigns("shop")).resolves.toEqual([]);
  await writeCampaigns("shop", [campaign]);
  await expect(readCampaigns("shop")).resolves.toEqual([campaign]);
  expect(files[campaignsPath]).toBeDefined();
});

test("writeCampaigns rejects on write error", async () => {
  const error = new Error("fail");
  fsMock.promises.writeFile.mockRejectedValueOnce(error);
  const { writeCampaigns } = await import("../cli");
  await expect(writeCampaigns("shop", [])).rejects.toBe(error);
});

