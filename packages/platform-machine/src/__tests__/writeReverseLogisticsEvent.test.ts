/** @jest-environment node */
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();
const mockRandomUUID = jest.fn(() => "uuid");

jest.mock("fs/promises", () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readdir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock("crypto", () => ({ randomUUID: mockRandomUUID }));

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/mock-data-root",
}));

// eslint-disable-next-line import/first -- imports must follow jest.mock declarations
import { writeReverseLogisticsEvent } from "../writeReverseLogisticsEvent";

describe("writeReverseLogisticsEvent", () => {
  beforeEach(() => {
    mockMkdir.mockReset();
    mockWriteFile.mockReset();
    mockRandomUUID.mockClear();
  });

  it("creates directory and writes file", async () => {
    await writeReverseLogisticsEvent("shop", "sess", "received", "/root");
    expect(mockMkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", {
      recursive: true,
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});
