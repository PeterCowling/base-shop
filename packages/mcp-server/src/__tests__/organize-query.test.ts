/** @jest-environment node */

import { buildOrganizeQuery } from "../utils/organize-query";

const SAMPLE_TERMINAL_LABELS = [
  "Brikette/Queue/In-Progress",
  "Brikette/Outcome/Resolved",
  "Brikette/Outcome/Drafted",
  "Brikette/Outcome/Forwarded",
  "Brikette/Queue/Deferred",
];

describe("buildOrganizeQuery", () => {
  // TC-06-01: label-absence mode returns query with -label: exclusions and newer_than: time clause
  it("TC-06-01: label-absence mode returns -label: exclusions and newer_than time clause", () => {
    const query = buildOrganizeQuery(SAMPLE_TERMINAL_LABELS, "label-absence");

    expect(query).toContain("in:inbox");
    expect(query).toContain("newer_than:7d");
    for (const label of SAMPLE_TERMINAL_LABELS) {
      expect(query).toContain(`-label:${label}`);
    }
    // Must not contain is:unread
    expect(query).not.toContain("is:unread");
  });

  // TC-06-02: adding a new label to terminalLabels causes it to appear in exclusions
  it("TC-06-02: adding a new label to terminalLabels includes it in exclusions", () => {
    const labelsWithNew = [
      ...SAMPLE_TERMINAL_LABELS,
      "Brikette/Outcome/No-Reply",
    ];
    const query = buildOrganizeQuery(labelsWithNew, "label-absence");

    expect(query).toContain("-label:Brikette/Outcome/No-Reply");
  });

  // TC-06-03: mode="unread" returns "is:unread in:inbox"
  it("TC-06-03: mode=unread without startDate returns is:unread in:inbox", () => {
    const query = buildOrganizeQuery(SAMPLE_TERMINAL_LABELS, "unread");

    expect(query).toBe("is:unread in:inbox");
  });

  // TC-06-03 (unread with startDate)
  it("TC-06-03b: mode=unread with startDate returns in:inbox after:DATE", () => {
    const query = buildOrganizeQuery(SAMPLE_TERMINAL_LABELS, "unread", {
      startDate: "2026-02-01",
    });

    expect(query).toBe("in:inbox after:2026-02-01");
  });

  // TC-06-05: startDate provided → query uses after:DATE instead of newer_than:7d
  it("TC-06-05: label-absence mode with startDate uses after:DATE not newer_than", () => {
    const query = buildOrganizeQuery(SAMPLE_TERMINAL_LABELS, "label-absence", {
      startDate: "2026-02-12",
    });

    expect(query).toContain("after:2026-02-12");
    expect(query).not.toContain("newer_than:");
    for (const label of SAMPLE_TERMINAL_LABELS) {
      expect(query).toContain(`-label:${label}`);
    }
  });

  it("label-absence mode with custom daysBack uses newer_than:Nd", () => {
    const query = buildOrganizeQuery(SAMPLE_TERMINAL_LABELS, "label-absence", {
      daysBack: 14,
    });

    expect(query).toContain("newer_than:14d");
    expect(query).not.toContain("newer_than:7d");
  });

  it("label-absence mode with empty terminalLabels returns in:inbox with time clause only", () => {
    const query = buildOrganizeQuery([], "label-absence");

    expect(query).toContain("in:inbox");
    expect(query).toContain("newer_than:7d");
    expect(query).not.toContain("-label:");
  });
});
