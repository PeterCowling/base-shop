import { describe, expect, it } from "@jest/globals";

import {
  computeHospitalityScenarioDateLabels,
  computeHospitalityScenarioInputs,
} from "../hospitality-scenarios";

/**
 * Hospitality scenario date computation tests
 *
 * Tests cover:
 * - TC-H-01: Scenario inputs for mid-season date (2026-02-20) — all three scenarios
 * - TC-H-02: Date labels for same date — day-of-week labels correct
 * - TC-H-03: travellers always = 1 for all scenarios
 * - TC-H-04: Year rollover — peak (S1) rolls to next year when month > 8
 * - TC-H-05: Year rollover — shoulder (S2) rolls to next year when month > 9
 * - TC-H-06: Year rollover — off-season (S3) rolls to next year when month > 2
 * - TC-H-07: Boundary month 8 — peak stays in current year
 * - TC-H-08: Boundary month 9 — shoulder stays in current year; peak already rolled
 * - TC-H-09: Year rollover — all three scenarios in next year when month = 10
 * - TC-H-10: S3 date in 2027 when asOfDate month = 3
 * - TC-H-11: S1 and S2 dates correct for current year when month = 1 (all cutoffs in current year)
 * - TC-H-12: Labels output matches inputs dates with correct day-of-week format
 */

describe("computeHospitalityScenarioInputs", () => {
  // TC-H-01: All three scenarios for 2026-02-20
  // S1: 3rd Friday of July 2026 → 2026-07-17 (Fri) to 2026-07-19 (Sun)
  // S2: 2nd Tuesday of May 2026 → 2026-05-12 (Tue) to 2026-05-14 (Thu)
  // S3: 4th Tuesday of February 2026 → 2026-02-24 (Tue) to 2026-02-26 (Thu)
  describe("TC-H-01: baseline date 2026-02-20", () => {
    it("computes correct check-in/check-out dates for all three scenarios", () => {
      const result = computeHospitalityScenarioInputs("2026-02-20");

      expect(result.s1.checkIn).toBe("2026-07-17");
      expect(result.s1.checkOut).toBe("2026-07-19");
      expect(result.s2.checkIn).toBe("2026-05-12");
      expect(result.s2.checkOut).toBe("2026-05-14");
      expect(result.s3.checkIn).toBe("2026-02-24");
      expect(result.s3.checkOut).toBe("2026-02-26");
    });
  });

  // TC-H-02: Day-of-week labels correct for 2026-02-20
  describe("TC-H-02: date labels for 2026-02-20", () => {
    it("includes correct day-of-week labels in output strings", () => {
      const result = computeHospitalityScenarioDateLabels("2026-02-20");

      // S1: 2026-07-17 is Friday, 2026-07-19 is Sunday
      expect(result.s1).toContain("2026-07-17 (Fri)");
      expect(result.s1).toContain("2026-07-19 (Sun)");

      // S2: 2026-05-12 is Tuesday, 2026-05-14 is Thursday
      expect(result.s2).toContain("2026-05-12 (Tue)");
      expect(result.s2).toContain("2026-05-14 (Thu)");

      // S3: 2026-02-24 is Tuesday, 2026-02-26 is Thursday
      expect(result.s3).toContain("2026-02-24 (Tue)");
      expect(result.s3).toContain("2026-02-26 (Thu)");
    });
  });

  // TC-H-03: travellers always 1
  describe("TC-H-03: travellers constant", () => {
    it("always sets travellers to 1 for all scenarios regardless of date", () => {
      const resultFeb = computeHospitalityScenarioInputs("2026-02-20");
      const resultOct = computeHospitalityScenarioInputs("2026-10-15");

      expect(resultFeb.s1.travellers).toBe(1);
      expect(resultFeb.s2.travellers).toBe(1);
      expect(resultFeb.s3.travellers).toBe(1);
      expect(resultOct.s1.travellers).toBe(1);
    });
  });

  // TC-H-04: Peak (S1) year rollover — month 9 pushes peak to next year
  // asOfMonth=9 > 8 → yearForPeak = 2027
  describe("TC-H-04: peak year rollover at month 9", () => {
    it("rolls S1 to July 2027 when asOfDate is September", () => {
      const result = computeHospitalityScenarioInputs("2026-09-01");

      // S1: 3rd Friday of July 2027
      // July 2027: July 1 = Thu (4); first Fri = July 2; 3rd Fri = July 16
      expect(result.s1.checkIn).toBe("2027-07-16");
      expect(result.s1.checkOut).toBe("2027-07-18");
    });
  });

  // TC-H-05: Shoulder (S2) boundary — month 9 still uses current year (9 <= 9)
  describe("TC-H-05: shoulder year boundary at month 9", () => {
    it("keeps S2 in current year (2026) when asOfDate is month 9", () => {
      const result = computeHospitalityScenarioInputs("2026-09-01");

      // S2: 2nd Tuesday of May 2026 = 2026-05-12
      expect(result.s2.checkIn).toBe("2026-05-12");
    });
  });

  // TC-H-06: Off-season (S3) year rollover — month 3 pushes S3 to next year
  // asOfMonth=3 > 2 → yearForOffSeason = 2027
  describe("TC-H-06: off-season year rollover at month 3", () => {
    it("rolls S3 to February 2027 when asOfDate is March", () => {
      const result = computeHospitalityScenarioInputs("2026-03-01");

      // S3: 4th Tuesday of February 2027
      // Feb 2027: Feb 1 = Mon (1); first Tue = Feb 2; 4th Tue = Feb 23
      expect(result.s3.checkIn).toBe("2027-02-23");
      expect(result.s3.checkOut).toBe("2027-02-25");
    });
  });

  // TC-H-07: Boundary month 8 — peak stays in current year
  // asOfMonth=8 <= 8 → yearForPeak = 2026
  describe("TC-H-07: peak stays in current year at month 8", () => {
    it("keeps S1 in July 2026 when asOfDate is month 8", () => {
      const result = computeHospitalityScenarioInputs("2026-08-01");

      expect(result.s1.checkIn).toBe("2026-07-17");
    });
  });

  // TC-H-08: Boundary month 9 — shoulder stays in current year; peak already rolled
  describe("TC-H-08: month 9 boundary — peak rolled but shoulder still current year", () => {
    it("rolls S1 to next year but keeps S2 in current year at month 9", () => {
      const result = computeHospitalityScenarioInputs("2026-09-15");

      // Peak rolled to 2027
      expect(result.s1.checkIn.startsWith("2027")).toBe(true);
      // Shoulder still 2026
      expect(result.s2.checkIn.startsWith("2026")).toBe(true);
    });
  });

  // TC-H-09: Month 10 — all three scenarios in next year
  // asOfMonth=10 > 8 (peak), > 9 (shoulder), > 2 (off-season) → all 2027
  describe("TC-H-09: month 10 — all scenarios roll to next year", () => {
    it("produces S1, S2, S3 all in 2027 when asOfDate is month 10", () => {
      const result = computeHospitalityScenarioInputs("2026-10-01");

      // S2: 2nd Tuesday of May 2027 — May 2027: May 1 = Sat (6); first Tue = May 4; 2nd Tue = May 11
      expect(result.s2.checkIn).toBe("2027-05-11");
      expect(result.s2.checkOut).toBe("2027-05-13");

      expect(result.s1.checkIn.startsWith("2027")).toBe(true);
      expect(result.s3.checkIn.startsWith("2027")).toBe(true);
    });
  });

  // TC-H-10: Month 3 — S3 rolls to 2027, S1 and S2 still in 2026
  describe("TC-H-10: month 3 — only S3 rolls to 2027", () => {
    it("keeps S1 and S2 in 2026 but rolls S3 to 2027", () => {
      const result = computeHospitalityScenarioInputs("2026-03-15");

      expect(result.s1.checkIn.startsWith("2026")).toBe(true);
      expect(result.s2.checkIn.startsWith("2026")).toBe(true);
      expect(result.s3.checkIn.startsWith("2027")).toBe(true);
    });
  });

  // TC-H-11: Month 1 — all three scenarios in current year
  // asOfMonth=1 <= 8 (peak), <= 9 (shoulder), <= 2 (off-season) → all 2026
  describe("TC-H-11: month 1 — all scenarios in current year", () => {
    it("keeps all three scenarios in current year when asOfDate is month 1", () => {
      const result = computeHospitalityScenarioInputs("2026-01-15");

      // S3: 4th Tuesday of February 2026 = 2026-02-24 (same as TC-H-01 computation)
      expect(result.s1.checkIn.startsWith("2026")).toBe(true);
      expect(result.s2.checkIn.startsWith("2026")).toBe(true);
      expect(result.s3.checkIn).toBe("2026-02-24");
    });
  });

  // TC-H-12: Labels output format matches inputs dates
  describe("TC-H-12: labels format consistency with inputs", () => {
    it("labels strings begin with the same checkIn dates as inputs for a given asOfDate", () => {
      const asOf = "2026-02-20";
      const inputs = computeHospitalityScenarioInputs(asOf);
      const labels = computeHospitalityScenarioDateLabels(asOf);

      // Each label string must start with the corresponding checkIn date
      expect(labels.s1.startsWith(inputs.s1.checkIn)).toBe(true);
      expect(labels.s2.startsWith(inputs.s2.checkIn)).toBe(true);
      expect(labels.s3.startsWith(inputs.s3.checkIn)).toBe(true);

      // Each label string must contain the corresponding checkOut date
      expect(labels.s1).toContain(inputs.s1.checkOut);
      expect(labels.s2).toContain(inputs.s2.checkOut);
      expect(labels.s3).toContain(inputs.s3.checkOut);

      // Labels contain "to" separator
      expect(labels.s1).toContain(" to ");
      expect(labels.s2).toContain(" to ");
      expect(labels.s3).toContain(" to ");
    });
  });
});
