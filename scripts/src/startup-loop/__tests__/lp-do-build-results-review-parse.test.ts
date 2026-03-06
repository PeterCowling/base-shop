import { describe, expect, it } from "@jest/globals";

import {
  classifyIdeaItem,
  extractBulletItems,
  parseIdeaCandidate,
  parseSections,
  type ProcessImprovementItem,
} from "../build/lp-do-build-results-review-parse";

describe("lp-do-build-results-review-parse", () => {
  it("TC-01: parseSections returns a map keyed by normalized section headings", () => {
    const sections = parseSections("## Goals\ncontent-a\n## Risks\ncontent-b");

    expect(sections.get("goals")).toBe("content-a");
    expect(sections.get("risks")).toBe("content-b");
  });

  it("TC-02: extractBulletItems flattens continuation lines into their bullet item", () => {
    const items = extractBulletItems("- First item\n- Second item\n  continuation");

    expect(items).toEqual(["First item", "Second item continuation"]);
  });

  it("TC-03: parseIdeaCandidate extracts title, trigger observation, and suggested action", () => {
    const candidate = parseIdeaCandidate(
      "Idea: Add rate limiting | Trigger observation: Rate abuse spotted | Suggested next action: Create card",
    );

    expect(candidate).toEqual({
      title: "Add rate limiting",
      body: "Rate abuse spotted",
      suggestedAction: "Create card",
    });
  });

  it("TC-04: classifyIdeaItem attaches classifier output fields to an idea item", () => {
    const item: ProcessImprovementItem = {
      type: "idea",
      business: "BOS",
      title: "Add caching",
      body: "Repeated expensive DB calls detected",
      source: "test",
      date: "2026-01-01",
      path: "test",
    };

    classifyIdeaItem(item);

    expect(typeof item.priority_tier).toBe("string");
    expect(typeof item.urgency).toBe("string");
    expect(typeof item.effort).toBe("string");
    expect(typeof item.reason_code).toBe("string");
    expect((item.reason_code ?? "").length).toBeGreaterThan(0);
  });

  it("TC-05: shared module exports parseSections and classifyIdeaItem together without import issues", () => {
    const sections = parseSections("## Goals\ncontent-a");
    const item: ProcessImprovementItem = {
      type: "idea",
      business: "BOS",
      title: "Reduce retries",
      body: "Retry storms are visible in logs",
      source: "test",
      date: "2026-01-01",
      path: "test",
    };

    classifyIdeaItem(item);

    expect(sections.get("goals")).toBe("content-a");
    expect(typeof item.priority_tier).toBe("string");
  });
});
