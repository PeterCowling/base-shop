export {};

import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  resetReverseLogisticsMocks,
} from "../src/__tests__/reverseLogisticsTestHelpers";

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReverseLogisticsMocks();
  readFile.mockResolvedValue("{}");
  mkdir.mockResolvedValue(undefined);
  writeFile.mockResolvedValue(undefined);
  unlink.mockResolvedValue(undefined);
});

describe("writeReverseLogisticsEvent", () => {
  it("writes event to shop directory", async () => {
    service = await import("@acme/platform-machine");
    await service.writeReverseLogisticsEvent("shop", "sess", "received", "/root");
    expect(mkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
  jest.unmock("@platform-core/dataRoot");
});

