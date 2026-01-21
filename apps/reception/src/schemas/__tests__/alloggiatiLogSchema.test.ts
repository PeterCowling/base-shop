
import "@testing-library/jest-dom";
import { alloggiatiLogEntrySchema } from "../alloggiatiLogSchema";

describe("alloggiatiLogEntrySchema", () => {
  it("accepts a full log entry", () => {
    const result = alloggiatiLogEntrySchema.safeParse({
      result: "OK",
      timestamp: "2024-01-01T12:00:00Z",
      erroreCod: "E001",
      erroreDes: "An error description",
      erroreDettaglio: "Detailed message",
      occupantRecord: "SOME RECORD",
      occupantRecordLength: 11,
    });
    expect(result.success).toBe(true);
  });

  it("allows optional fields to be absent", () => {
    const result = alloggiatiLogEntrySchema.safeParse({
      result: "OK",
      timestamp: "2024-01-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects entries with invalid types", () => {
    const result = alloggiatiLogEntrySchema.safeParse({
      result: 123,
      timestamp: "2024-01-01T12:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
