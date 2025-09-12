export const mkdir = jest.fn();
export const writeFile = jest.fn();
export const readdir = jest.fn();
export const readFile = jest.fn();
export const unlink = jest.fn();

jest.mock("fs/promises", () => ({
  mkdir,
  writeFile,
  readdir,
  readFile,
  unlink,
}));

export const markReceived = jest.fn();
export const markCleaning = jest.fn();
export const markRepair = jest.fn();
export const markQa = jest.fn();
export const markAvailable = jest.fn();

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  markReceived,
  markCleaning,
  markRepair,
  markQa,
  markAvailable,
}));

export const reverseLogisticsEvents = {
  received: jest.fn(),
  cleaning: jest.fn(),
  repair: jest.fn(),
  qa: jest.fn(),
  available: jest.fn(),
};

jest.mock("@platform-core/repositories/reverseLogisticsEvents.server", () => ({
  reverseLogisticsEvents,
}));

export const logger = { error: jest.fn() };
jest.mock("@platform-core/utils", () => ({ logger }));

export const randomUUID = jest.fn(() => "uuid");
jest.mock("crypto", () => ({ randomUUID }));

export function resetReverseLogisticsMocks(): void {
  mkdir.mockReset();
  writeFile.mockReset();
  readdir.mockReset();
  readFile.mockReset();
  unlink.mockReset();
  markReceived.mockReset();
  markCleaning.mockReset();
  markRepair.mockReset();
  markQa.mockReset();
  markAvailable.mockReset();
  Object.values(reverseLogisticsEvents).forEach((fn) => fn.mockReset());
  logger.error.mockReset();
  randomUUID.mockClear();
}

