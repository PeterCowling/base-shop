// TC-06: Bug 4 — isEligibleForPreorderTonight only checks tonight's night slot
import { isEligibleForPreorderTonight } from "../CompScreen";

// Set system time to 2025-01-02 (daysSince = 1 → tonight = night2)
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2025, 0, 2, 12, 0, 0)); // 2025-01-02 local noon
});

afterAll(() => {
  jest.useRealTimers();
});

const CHECK_IN_NIGHT1 = "2025-01-02"; // checked in today → night1 is tonight
const CHECK_IN_NIGHT2 = "2025-01-01"; // checked in yesterday → night2 is tonight

describe("isEligibleForPreorderTonight", () => {
  // TC-06a: only non-tonight night has eligible data → false
  it("TC-06a: returns false when only a non-tonight night is eligible", () => {
    // Today is night2 for this guest (checkIn=2025-01-01).
    // Preorder has night1 with non-NA data, night2 all-NA.
    const preorderData = {
      night1: { breakfast: "Cooked", drink1: "NA", drink2: "NA" },
      night2: { breakfast: "NA", drink1: "NA", drink2: "NA" },
    };
    expect(isEligibleForPreorderTonight(preorderData, CHECK_IN_NIGHT2)).toBe(false);
  });

  // TC-06b: tonight's night has eligible breakfast → true
  it("TC-06b: returns true when tonight's night has a non-NA breakfast", () => {
    // Today is night2 for this guest.
    const preorderData = {
      night1: { breakfast: "NA", drink1: "NA", drink2: "NA" },
      night2: { breakfast: "Cooked", drink1: "NA", drink2: "NA" },
    };
    expect(isEligibleForPreorderTonight(preorderData, CHECK_IN_NIGHT2)).toBe(true);
  });

  // TC-06c: tonight's night is all-NA → false
  it("TC-06c: returns false when tonight's night is all-NA", () => {
    const preorderData = {
      night2: { breakfast: "NA", drink1: "NA", drink2: "NA" },
    };
    expect(isEligibleForPreorderTonight(preorderData, CHECK_IN_NIGHT2)).toBe(false);
  });

  // TC-06d: no preorder data → false
  it("TC-06d: returns false when preorderData is undefined", () => {
    expect(isEligibleForPreorderTonight(undefined, CHECK_IN_NIGHT2)).toBe(false);
  });

  // TC-06e: empty checkInDate → false (safe default)
  it("TC-06e: returns false when checkInDate is empty string", () => {
    const preorderData = {
      night1: { breakfast: "Cooked", drink1: "NA", drink2: "NA" },
    };
    expect(isEligibleForPreorderTonight(preorderData, "")).toBe(false);
  });

  // Tonight is night1 for a guest who checked in today
  it("TC-06f: returns true when guest checked in today and night1 has eligible data", () => {
    const preorderData = {
      night1: { breakfast: "NA", drink1: "Beer", drink2: "NA" },
    };
    expect(isEligibleForPreorderTonight(preorderData, CHECK_IN_NIGHT1)).toBe(true);
  });
});
