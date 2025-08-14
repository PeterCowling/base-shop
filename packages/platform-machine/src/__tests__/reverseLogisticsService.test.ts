import path from "node:path";
import { readdir, readFile, unlink } from "node:fs/promises";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn(),
  readdir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  markAvailable: jest.fn(),
  markCleaning: jest.fn(),
  markQa: jest.fn(),
  markReceived: jest.fn(),
  markRepair: jest.fn(),
}));

jest.mock("@platform-core/repositories/reverseLogisticsEvents.server", () => ({
  reverseLogisticsEvents: {
    received: jest.fn(),
    cleaning: jest.fn(),
    repair: jest.fn(),
    qa: jest.fn(),
    available: jest.fn(),
  },
}));

import { processReverseLogisticsEventsOnce } from "../reverseLogisticsService";
import { markCleaning } from "@platform-core/repositories/rentalOrders.server";
import { reverseLogisticsEvents } from "@platform-core/repositories/reverseLogisticsEvents.server";

describe("processReverseLogisticsEventsOnce", () => {
  const readdirMock = readdir as unknown as jest.Mock;
  const readFileMock = readFile as unknown as jest.Mock;
  const unlinkMock = unlink as unknown as jest.Mock;

  beforeEach(() => {
    readdirMock.mockReset();
    readFileMock.mockReset();
    unlinkMock.mockReset();
    (markCleaning as jest.Mock).mockReset();
    (reverseLogisticsEvents.cleaning as jest.Mock).mockReset();
  });

  it("updates order status and records history", async () => {
    const root = "/data";
    const shop = "s1";
    const evtFile = "e1.json";

    readdirMock.mockResolvedValueOnce([evtFile]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "cleaning" })
    );

    await processReverseLogisticsEventsOnce(shop, root);

    expect(markCleaning).toHaveBeenCalledWith(shop, "abc");
    expect(reverseLogisticsEvents.cleaning).toHaveBeenCalledWith(shop, "abc");
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join(root, shop, "reverse-logistics", evtFile)
    );
  });
});
