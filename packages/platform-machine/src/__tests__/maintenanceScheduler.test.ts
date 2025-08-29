jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

import { readdir } from "fs/promises";
import { logger } from "@platform-core/utils";
import { startMaintenanceScheduler } from "../maintenanceScheduler";

describe("startMaintenanceScheduler", () => {
  let timer: NodeJS.Timeout;
  const readdirMock = readdir as unknown as jest.Mock;
  const errorMock = logger.error as unknown as jest.Mock;

  afterEach(() => {
    if (timer) {
      clearInterval(timer);
    }
    jest.clearAllMocks();
  });

  it("logs an error when runMaintenanceScan throws", async () => {
    readdirMock.mockRejectedValueOnce(new Error("fail"));

    timer = startMaintenanceScheduler();

    await Promise.resolve();
    await Promise.resolve();

    expect(errorMock).toHaveBeenCalledWith("maintenance scan failed", {
      err: expect.any(Error),
    });
  });
});
