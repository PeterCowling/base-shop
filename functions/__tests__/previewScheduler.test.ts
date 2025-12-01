import { promises as fs } from "node:fs";
import previewScheduler from "../src/previewScheduler";

jest.mock("node:fs", () => {
  const path = require("node:path");
  return {
    __esModule: true,
    promises: {
      readFile: jest.fn(async (file: string) => {
        if (file.endsWith("page-schedules.json")) {
          const now = Date.now();
          const past = new Date(now - 60_000).toISOString();
          const future = new Date(now + 60_000).toISOString();
          return JSON.stringify({
            "shop-a": {
              "page-1": [
                {
                  id: "s1",
                  shop: "shop-a",
                  pageId: "page-1",
                  versionId: "v1",
                  publishAt: past,
                  createdAt: past,
                },
                {
                  id: "s2",
                  shop: "shop-a",
                  pageId: "page-1",
                  versionId: "v2",
                  publishAt: future,
                  createdAt: future,
                },
              ],
            },
          });
        }
        if (file.endsWith("page-schedules.processed.json")) {
          return JSON.stringify({});
        }
        if (file.endsWith("sections.json")) {
          const nowIso = new Date().toISOString();
          const past = new Date(Date.now() - 3_600_000).toISOString();
          const future = new Date(Date.now() + 3_600_000).toISOString();
          return JSON.stringify([
            { id: "sec1", status: "draft", publishAt: past, expireAt: future },
            {
              id: "sec2",
              status: "published",
              publishAt: past,
              expireAt: past,
            },
            {
              id: "sec3",
              status: "draft",
              publishAt: undefined,
              expireAt: undefined,
            },
          ]);
        }
        throw new Error(`Unexpected readFile: ${file}`);
      }),
      writeFile: jest.fn(async () => {}),
      mkdir: jest.fn(async () => {}),
      readdir: jest.fn(async (dir: string, opts: { withFileTypes?: boolean }) => {
        if (opts && opts.withFileTypes) {
          return [
            {
              name: "shop-a",
              isDirectory: () => true,
              isFile: () => false,
            },
          ];
        }
        const path = require("node:path");
        return ["shop-a"].map((name) => path.join(dir, name));
      }),
    },
  };
});

const readFileMock = fs.readFile as unknown as jest.Mock;
const writeFileMock = fs.writeFile as unknown as jest.Mock;
const readdirMock = fs.readdir as unknown as jest.Mock;

describe("previewScheduler.scheduled", () => {
  beforeEach(() => {
    readFileMock.mockClear();
    writeFileMock.mockClear();
    readdirMock.mockClear();
  });

  it("marks due schedules as processed and logs events", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await previewScheduler.scheduled();

    // One ready-to-publish event for the due schedule
    expect(logSpy).toHaveBeenCalled();
    const readyEvents = logSpy.mock.calls
      .map(([arg]) => String(arg))
      .filter((msg) => msg.includes('"type":"ready-to-publish"'));
    expect(readyEvents.length).toBe(1);
    const payload = JSON.parse(readyEvents[0]);
    expect(payload).toMatchObject({
      type: "ready-to-publish",
      shop: "shop-a",
      pageId: "page-1",
      versionId: "v1",
      scheduleId: "s1",
    });

    // Processed file updated with the schedule marked as processed
    expect(writeFileMock).toHaveBeenCalled();
    const processedCall = writeFileMock.mock.calls.find(([file]) =>
      String(file).includes("page-schedules.processed.json"),
    );
    expect(processedCall).toBeDefined();
    const processed = JSON.parse(processedCall![1] as string);
    expect(processed.s1).toBe(true);

    logSpy.mockRestore();
  });

  it("updates section statuses based on publish/expire windows", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await previewScheduler.scheduled();

    // Section-level status changes should be logged
    const sectionEvents = logSpy.mock.calls
      .map(([arg]) => String(arg))
      .filter((msg) => msg.includes('"type":"section-status-change"'));
    expect(sectionEvents.length).toBeGreaterThan(0);

    // Updated sections.json is written with adjusted statuses
    const sectionWriteCalls = writeFileMock.mock.calls.filter(([file]) =>
      String(file).includes("sections.json"),
    );
    expect(sectionWriteCalls.length).toBe(1);
    const updatedSections = JSON.parse(sectionWriteCalls[0][1] as string);
    const sec1 = updatedSections.find((s: any) => s.id === "sec1");
    const sec2 = updatedSections.find((s: any) => s.id === "sec2");
    expect(sec1.status).toBe("published");
    expect(sec2.status).toBe("draft");

    logSpy.mockRestore();
  });
});
