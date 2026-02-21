import { ActivityCode } from "../activities";

describe("ActivityCode enum", () => {
  // TC-01: Enum includes both OCCUPANT_DELETED (25) and CANCELLED (27) → compiles successfully
  test("should include OCCUPANT_DELETED with value 25", () => {
    expect(ActivityCode.OCCUPANT_DELETED).toBe(25);
  });

  test("should include CANCELLED with value 27", () => {
    expect(ActivityCode.CANCELLED).toBe(27);
  });

  // TC-02: Import ActivityCode in test file → both codes accessible as ActivityCode.OCCUPANT_DELETED and ActivityCode.CANCELLED
  test("should allow access to both codes via ActivityCode namespace", () => {
    // Verify both codes are accessible and have correct types
    const deletedCode: ActivityCode = ActivityCode.OCCUPANT_DELETED;
    const cancelledCode: ActivityCode = ActivityCode.CANCELLED;

    expect(typeof deletedCode).toBe("number");
    expect(typeof cancelledCode).toBe("number");
    expect(deletedCode).toBe(25);
    expect(cancelledCode).toBe(27);
  });

  // Additional type safety check: ensure codes are distinct
  test("should have distinct values for OCCUPANT_DELETED and CANCELLED", () => {
    expect(ActivityCode.OCCUPANT_DELETED).not.toBe(ActivityCode.CANCELLED);
  });
});
