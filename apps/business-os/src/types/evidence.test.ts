import { describe, expect, it } from "@jest/globals";

import {
  evidenceEntrySchema,
  EvidenceSourceType,
  evidenceSourceTypes,
  evidenceSourceTypeSchema,
  getEvidenceSourceColor,
  getEvidenceSourceLabel,
} from "./evidence";

describe("EvidenceSourceType", () => {
  it("should have all required enum values", () => {
    expect(EvidenceSourceType.measurement).toBe("measurement");
    expect(EvidenceSourceType["customer-input"]).toBe("customer-input");
    expect(EvidenceSourceType["repo-diff"]).toBe("repo-diff");
    expect(EvidenceSourceType.experiment).toBe("experiment");
    expect(EvidenceSourceType["financial-model"]).toBe("financial-model");
    expect(EvidenceSourceType["vendor-quote"]).toBe("vendor-quote");
    expect(EvidenceSourceType.legal).toBe("legal");
    expect(EvidenceSourceType.assumption).toBe("assumption");
    expect(EvidenceSourceType.other).toBe("other");
  });

  it("should export array of all types", () => {
    expect(evidenceSourceTypes).toHaveLength(9);
    expect(evidenceSourceTypes).toContain("measurement");
    expect(evidenceSourceTypes).toContain("customer-input");
    expect(evidenceSourceTypes).toContain("repo-diff");
    expect(evidenceSourceTypes).toContain("experiment");
    expect(evidenceSourceTypes).toContain("financial-model");
    expect(evidenceSourceTypes).toContain("vendor-quote");
    expect(evidenceSourceTypes).toContain("legal");
    expect(evidenceSourceTypes).toContain("assumption");
    expect(evidenceSourceTypes).toContain("other");
  });
});

describe("evidenceSourceTypeSchema", () => {
  it("should validate all enum values", () => {
    evidenceSourceTypes.forEach((type) => {
      expect(() => evidenceSourceTypeSchema.parse(type)).not.toThrow();
    });
  });

  it("should reject invalid values", () => {
    expect(() => evidenceSourceTypeSchema.parse("invalid")).toThrow();
    expect(() => evidenceSourceTypeSchema.parse("")).toThrow();
    expect(() => evidenceSourceTypeSchema.parse(null)).toThrow();
    expect(() => evidenceSourceTypeSchema.parse(undefined)).toThrow();
  });
});

describe("evidenceEntrySchema", () => {
  it("should validate valid evidence entry", () => {
    const entry = {
      sourceType: "measurement",
      description: "Page load time decreased by 200ms",
      link: "https://example.com/report",
      date: "2026-01-28",
    };
    expect(() => evidenceEntrySchema.parse(entry)).not.toThrow();
  });

  it("should validate entry without optional fields", () => {
    const entry = {
      sourceType: "assumption",
      description: "Users prefer mobile-first design",
    };
    expect(() => evidenceEntrySchema.parse(entry)).not.toThrow();
  });

  it("should reject entry with missing description", () => {
    const entry = {
      sourceType: "measurement",
      description: "",
    };
    expect(() => evidenceEntrySchema.parse(entry)).toThrow();
  });

  it("should reject entry with invalid source type", () => {
    const entry = {
      sourceType: "invalid-type",
      description: "Some evidence",
    };
    expect(() => evidenceEntrySchema.parse(entry)).toThrow();
  });

  it("should reject entry with invalid date format", () => {
    const entry = {
      sourceType: "measurement",
      description: "Some evidence",
      date: "01/28/2026", // Invalid format
    };
    expect(() => evidenceEntrySchema.parse(entry)).toThrow();
  });

  it("should accept entry with valid date format", () => {
    const entry = {
      sourceType: "measurement",
      description: "Some evidence",
      date: "2026-01-28",
    };
    expect(() => evidenceEntrySchema.parse(entry)).not.toThrow();
  });
});

describe("getEvidenceSourceLabel", () => {
  const labelMap: Record<string, string> = {
    "businessOs.evidence.labels.measurement": "Measurement",
    "businessOs.evidence.labels.customerInput": "Customer Input",
    "businessOs.evidence.labels.repoDiff": "Code Changes",
    "businessOs.evidence.labels.experiment": "Experiment",
    "businessOs.evidence.labels.financialModel": "Financial Model",
    "businessOs.evidence.labels.vendorQuote": "Vendor Quote",
    "businessOs.evidence.labels.legal": "Legal",
    "businessOs.evidence.labels.assumption": "Assumption",
    "businessOs.evidence.labels.other": "Other",
  };
  const t = (key: string) => labelMap[key] ?? key;

  it("should return human-readable labels for all types", () => {
    expect(getEvidenceSourceLabel("measurement", t)).toBe("Measurement");
    expect(getEvidenceSourceLabel("customer-input", t)).toBe("Customer Input");
    expect(getEvidenceSourceLabel("repo-diff", t)).toBe("Code Changes");
    expect(getEvidenceSourceLabel("experiment", t)).toBe("Experiment");
    expect(getEvidenceSourceLabel("financial-model", t)).toBe("Financial Model");
    expect(getEvidenceSourceLabel("vendor-quote", t)).toBe("Vendor Quote");
    expect(getEvidenceSourceLabel("legal", t)).toBe("Legal");
    expect(getEvidenceSourceLabel("assumption", t)).toBe("Assumption");
    expect(getEvidenceSourceLabel("other", t)).toBe("Other");
  });
});

describe("getEvidenceSourceColor", () => {
  it("should return green for high-confidence sources", () => {
    expect(getEvidenceSourceColor("measurement")).toBe("green");
    expect(getEvidenceSourceColor("experiment")).toBe("green");
    expect(getEvidenceSourceColor("repo-diff")).toBe("green");
  });

  it("should return blue for medium-high confidence sources", () => {
    expect(getEvidenceSourceColor("customer-input")).toBe("blue");
    expect(getEvidenceSourceColor("financial-model")).toBe("blue");
    expect(getEvidenceSourceColor("vendor-quote")).toBe("blue");
    expect(getEvidenceSourceColor("legal")).toBe("blue");
  });

  it("should return yellow for assumptions", () => {
    expect(getEvidenceSourceColor("assumption")).toBe("yellow");
  });

  it("should return gray for other/unknown", () => {
    expect(getEvidenceSourceColor("other")).toBe("gray");
  });
});
