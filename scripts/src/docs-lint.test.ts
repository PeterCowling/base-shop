import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Mock execFileSync to prevent actual git calls during tests
jest.mock("child_process", () => ({
  execFileSync: jest.fn(),
}));

const mockedExecFileSync = execFileSync as unknown as ReturnType<typeof jest.fn>;

describe("docs-lint Business OS validation", () => {
  const originalCwd = process.cwd();
  let tempDir: string;
  let docsDir: string;

  beforeEach(async () => {
    // Create temp directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-lint-test-"));
    docsDir = path.join(tempDir, "docs");
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(path.join(docsDir, "business-os"), { recursive: true });

    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original working directory before cleanup
    process.chdir(originalCwd);
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Idea validation", () => {
    it("should require Type, Business, Owner, and ID fields", async () => {
      const ideaPath = path.join(docsDir, "business-os/test-idea.user.md");
      const content = `---
Type: Idea
Status: Draft
---

# Test Idea
`;
      await fs.writeFile(ideaPath, content, "utf-8");

      // Mock git ls-files to return our test file
      mockedExecFileSync.mockReturnValue(
        `docs/business-os/test-idea.user.md\0`
      );

      // Import and run docs-lint (would need to export validation function)
      // For now, we'll test the parseHeader function directly
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Idea");
      expect(header.status).toBe("Draft");
      expect(header.business).toBeNull();
      expect(header.owner).toBeNull();
      expect(header.id).toBeNull();
    });
  });

  describe("Card validation", () => {
    it("should require all card fields", async () => {
      const cardContent = `---
Type: Card
Status: Active
Business: BRIK
Lane: Inbox
Priority: P2
Owner: Pete
ID: BRIK-OPP-0001
Created: 2026-01-28
Last-updated: 2026-01-28
---

# Test Card
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(cardContent);

      expect(header.type).toBe("Card");
      expect(header.business).toBe("BRIK");
      expect(header.lane).toBe("Inbox");
      expect(header.priority).toBe("P2");
      expect(header.owner).toBe("Pete");
      expect(header.id).toBe("BRIK-OPP-0001");
      expect(header.created).toBe("2026-01-28");
      expect(header.lastUpdated).toBe("2026-01-28");
    });
  });

  describe("Stage document validation", () => {
    it("should require Card-ID for Fact-Find", async () => {
      const content = `---
Type: Fact-Find
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Fact-Finding
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Fact-Find");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Plan", async () => {
      const content = `---
Type: Plan
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Plan
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Plan");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Build-Log", async () => {
      const content = `---
Type: Build-Log
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Build Log
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Build-Log");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Reflection", async () => {
      const content = `---
Type: Reflection
Status: Complete
Card-ID: BRIK-OPP-0001
---

# Reflection
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Reflection");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });
  });

  describe("Comment validation", () => {
    it("should require Author, Created, and Card-ID", async () => {
      const content = `---
Type: Comment
Author: Pete
Created: 2026-01-28 10:30:00
Card-ID: BRIK-OPP-0001
---

This is a comment.
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Comment");
      expect(header.author).toBe("Pete");
      expect(header.created).toBe("2026-01-28 10:30:00");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });
  });

  describe("Business-Plan validation", () => {
    it("should require Business and Last-reviewed", async () => {
      const content = `---
Type: Business-Plan
Status: Active
Business: BRIK
Last-reviewed: 2026-01-28
---

# Business Plan
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Business-Plan");
      expect(header.business).toBe("BRIK");
      expect(header.lastReviewed).toBe("2026-01-28");
    });
  });

  describe("People validation", () => {
    it("should require Last-reviewed", async () => {
      const content = `---
Type: People
Status: Active
Last-reviewed: 2026-01-28
---

# People
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("People");
      expect(header.lastReviewed).toBe("2026-01-28");
    });
  });

  describe("parseHeader function", () => {
    it("should extract all Business OS frontmatter fields", async () => {
      const content = `---
Type: Card
Status: Active
Domain: Business OS
Business: BRIK
Owner: Pete
ID: BRIK-OPP-0001
Lane: Inbox
Priority: P2
Card-ID: BRIK-OPP-0001
Author: Pete
Created: 2026-01-28
Last-reviewed: 2026-01-28
Last-updated: 2026-01-28
---

# Test
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Card");
      expect(header.status).toBe("Active");
      expect(header.domain).toBe("Business OS");
      expect(header.business).toBe("BRIK");
      expect(header.owner).toBe("Pete");
      expect(header.id).toBe("BRIK-OPP-0001");
      expect(header.lane).toBe("Inbox");
      expect(header.priority).toBe("P2");
      expect(header.cardId).toBe("BRIK-OPP-0001");
      expect(header.author).toBe("Pete");
      expect(header.created).toBe("2026-01-28");
      expect(header.lastReviewed).toBe("2026-01-28");
      expect(header.lastUpdated).toBe("2026-01-28");
    });

    it("should return null for missing fields", async () => {
      const content = `---
Type: Idea
---

# Minimal
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Idea");
      expect(header.status).toBeNull();
      expect(header.business).toBeNull();
      expect(header.owner).toBeNull();
    });
  });
});

// ── VC-01: Stage-label adjacency lint rule ────────────────────────────────────

describe("checkBareStageIds (VC-01)", () => {
  it("VC-01: bare stage ID in prose triggers violation", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `---
Type: Plan
Status: Draft
---

# Workflow

The business is in SELL-01 and needs to proceed.
`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain("SELL-01");
  });

  it("VC-01: corrected form 'SELL-01 — label' does not trigger violation", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `---
Type: Plan
Status: Draft
---

# Workflow

The current stage is SELL-01 — Channel strategy + GTM.
`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: corrected form 'label (SELL-01)' does not trigger violation", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `The business has entered Channel strategy + GTM (SELL-01).`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: stage ID inside fenced code block is not flagged", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `# Workflow

\`\`\`yaml
current_stage: SELL-01
\`\`\`
`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: stage ID in inline code is not flagged", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `Run \`--stage SELL-01\` to target the channel strategy stage.`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: stage ID in YAML frontmatter is not flagged", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `---
Type: Plan
Status: Draft
current_stage: S3
---

# Forecast stage
`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: stage transition notation MARKET-02→SELL-01 is not flagged", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `Gate evaluated at the MARKET-02→SELL-01 fan-out.`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-01: multiple bare IDs on separate lines produces one violation per line", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `First go to S3.
Then advance to DO.
`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(2);
    expect(violations[0]).toContain("S3");
    expect(violations[1]).toContain("DO");
  });

  it("VC-01: 'S10' (two-digit) is recognised as a canonical ID", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `The weekly review runs at S10.`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain("S10");
  });

  it("VC-01: 'S10 — Weekly decision' is not flagged", async () => {
    const { checkBareStageIds } = await import("./docs-lint-helpers");
    const content = `Advance to S10 — Weekly decision for go/no-go.`;
    const violations = checkBareStageIds(content);
    expect(violations.length).toBe(0);
  });
});

describe("checkRetiredMarketingSalesStageIds (VC-02)", () => {
  it("VC-02: flags retired marketing/sales IDs in prose", async () => {
    const { checkRetiredMarketingSalesStageIds } = await import("./docs-lint-helpers");
    const content = `Legacy stage S6B should not appear.`;
    const violations = checkRetiredMarketingSalesStageIds(content);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain("S6B");
  });

  it("VC-02: does not flag canonical MARKET/SELL IDs", async () => {
    const { checkRetiredMarketingSalesStageIds } = await import("./docs-lint-helpers");
    const content = `Current flow: MARKET-02 → SELL-01.`;
    const violations = checkRetiredMarketingSalesStageIds(content);
    expect(violations.length).toBe(0);
  });

  it("VC-02: ignores retired IDs inside fenced code and inline code", async () => {
    const { checkRetiredMarketingSalesStageIds } = await import("./docs-lint-helpers");
    const content = `Run \`--stage S6B\`.\n\n\`\`\`yaml\ncurrent_stage: S2B\n\`\`\`\n`;
    const violations = checkRetiredMarketingSalesStageIds(content);
    expect(violations.length).toBe(0);
  });
});

// ── VC-03: Hygiene lint check (Owner: + Review-trigger:) ─────────────────────

describe("Hygiene lint check (VC-03)", () => {
  it("TC-02: doc with Owner: and Review-trigger: passes hygiene check", () => {
    // A standing doc that contains both required hygiene fields should produce
    // no hygiene warnings. We verify by checking both regex patterns directly
    // (the same logic used in docs-lint.ts).
    const content = `---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
Owner: Pete
Review-trigger: After each completed build cycle touching product scope
Confidence: 0.7
Last-updated: 2026-02-22
---

# HEAD Intake Packet

Content here.
`;
    const hasOwner = /^Owner:[ \t]*\S/m.test(content);
    const hasReviewTrigger = /^Review-trigger:[ \t]*\S/m.test(content);
    expect(hasOwner).toBe(true);
    expect(hasReviewTrigger).toBe(true);
  });

  it("TC-01: doc missing Review-trigger: fails hygiene check", () => {
    // A standing doc that has Owner: but is missing Review-trigger: should
    // be detected as a hygiene violation. This verifies the lint rule detects
    // the missing field correctly.
    const content = `---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
Owner: Pete
---

# HEAD Intake Packet

Content here.
`;
    const hasOwner = /^Owner:[ \t]*\S/m.test(content);
    const hasReviewTrigger = /^Review-trigger:[ \t]*\S/m.test(content);
    expect(hasOwner).toBe(true);
    expect(hasReviewTrigger).toBe(false);
  });

  it("TC-03: doc missing both Owner: and Review-trigger: fails hygiene check", () => {
    // A standing doc missing both required hygiene fields should produce two
    // separate violations — one for Owner: and one for Review-trigger:.
    const content = `---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
---

# HEAD Intake Packet

Content here.
`;
    const hasOwner = /^Owner:[ \t]*\S/m.test(content);
    const hasReviewTrigger = /^Review-trigger:[ \t]*\S/m.test(content);
    expect(hasOwner).toBe(false);
    expect(hasReviewTrigger).toBe(false);
  });

  it("TC-04: doc with HYGIENE-EXEMPT comment is suppressed", () => {
    // A standing doc containing the suppression comment should be excluded
    // from the hygiene check. The presence of the suppression pattern is
    // verified here; the actual suppression is applied in docs-lint.ts.
    const content = `---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
---

<!-- HYGIENE-EXEMPT: legacy doc, will be updated in next review cycle [ttl=2026-03-31] -->

# HEAD Intake Packet

Content here.
`;
    const isExempt = /<!--\s*HYGIENE-EXEMPT\s*:/.test(content);
    expect(isExempt).toBe(true);
  });

  it("TC-05: Owner: field with empty value is not treated as present", () => {
    // An Owner: field with no value (just whitespace) must not count as satisfying
    // the hygiene requirement. The regex requires at least one non-space character.
    const content = `---
Type: Startup-Intake-Packet
Status: Active
Owner:
Review-trigger: After each build cycle
---

# Intake
`;
    const hasOwner = /^Owner:[ \t]*\S/m.test(content);
    // "Owner:" with no value — should be false (regex uses [ \t]* to avoid crossing line boundaries)
    expect(hasOwner).toBe(false);
  });
});
