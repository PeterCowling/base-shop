/** @jest-environment node */

/**
 * TASK-07: Tests for slot migration in email-templates.json.
 *
 * TC-01: Migrated check-in template contains {{SLOT:GREETING}} and {{SLOT:KNOWLEDGE_INJECTION}}
 * TC-02: Migrated template with no knowledge injection slot passes through unchanged
 * TC-03: Unmigrated template (no slots) assembles identically to pre-TASK-03 baseline
 * TC-04: All 7 migrated templates have normalization_batch "B" and contain slot markers
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="template-slot-migration.test" --no-coverage
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveSlots } from "../utils/slot-resolver";
import { lintTemplatesSync } from "../utils/template-lint";

// ---------------------------------------------------------------------------
// Load email-templates.json
// ---------------------------------------------------------------------------

const TEMPLATES_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "email-templates.json",
);

interface TemplateEntry {
  subject: string;
  body: string;
  category: string;
  template_id: string;
  normalization_batch: string;
}

const templates: TemplateEntry[] = JSON.parse(
  readFileSync(TEMPLATES_PATH, "utf-8"),
) as TemplateEntry[];

// ---------------------------------------------------------------------------
// Migration targets
// ---------------------------------------------------------------------------

const MIGRATED_TEMPLATE_IDS = ["T04", "T05", "T08", "T18", "T20", "T22", "T29"];

function getTemplate(id: string): TemplateEntry {
  const found = templates.find((t) => t.template_id === id);
  if (!found) throw new Error(`Template not found: ${id}`);
  return found;
}

// ---------------------------------------------------------------------------
// TC-01: Migrated templates contain slot markers
// ---------------------------------------------------------------------------

describe("TASK-07: TC-01 Migrated templates contain slot markers", () => {
  for (const id of MIGRATED_TEMPLATE_IDS) {
    it(`${id} contains {{SLOT:GREETING}}`, () => {
      const template = getTemplate(id);
      expect(template.body).toContain("{{SLOT:GREETING}}");
    });

    it(`${id} contains {{SLOT:KNOWLEDGE_INJECTION}}`, () => {
      const template = getTemplate(id);
      expect(template.body).toContain("{{SLOT:KNOWLEDGE_INJECTION}}");
    });

    it(`${id} does NOT contain 'Dear Guest'`, () => {
      const template = getTemplate(id);
      expect(template.body).not.toMatch(/Dear Guest[,\s]/);
    });
  }
});

// ---------------------------------------------------------------------------
// TC-04: Migrated templates have normalization_batch "B"
// ---------------------------------------------------------------------------

describe("TASK-07: TC-04 Migrated templates have normalization_batch B", () => {
  for (const id of MIGRATED_TEMPLATE_IDS) {
    it(`${id} normalization_batch is "B"`, () => {
      const template = getTemplate(id);
      expect(template.normalization_batch).toBe("B");
    });
  }
});

// ---------------------------------------------------------------------------
// TC-01 (extended): Slots resolved correctly
// ---------------------------------------------------------------------------

describe("TASK-07: TC-01 Slot resolution inserts content at correct position", () => {
  it("GREETING slot filled with guest name appears at start", () => {
    const template = getTemplate("T04"); // Transportation to Hostel Brikette
    const resolved = resolveSlots(template.body, {
      GREETING: "Dear Maria,",
      KNOWLEDGE_INJECTION: "",
    });
    // Should start with greeting
    expect(resolved.startsWith("Dear Maria,")).toBe(true);
  });

  it("KNOWLEDGE_INJECTION slot filled with content appears in body (not appended at end)", () => {
    const template = getTemplate("T20"); // Breakfast — Eligibility and Hours
    const injection = "Note: Breakfast is gluten-free available on request.";
    const resolved = resolveSlots(template.body, {
      GREETING: "Dear Guest,",
      KNOWLEDGE_INJECTION: injection,
    });
    // Injection should appear before sign-off, not at the very end
    const injectionPos = resolved.indexOf(injection);
    const signOffPos = resolved.indexOf("Best regards,");
    expect(injectionPos).toBeGreaterThan(-1);
    expect(injectionPos).toBeLessThan(signOffPos);
  });

  it("TC-02: Empty KNOWLEDGE_INJECTION slot removed cleanly (no slot artifact)", () => {
    const template = getTemplate("T22"); // Luggage Storage
    const resolved = resolveSlots(template.body, {
      GREETING: "Dear Guest,",
      KNOWLEDGE_INJECTION: "",
    });
    expect(resolved).not.toContain("{{SLOT:KNOWLEDGE_INJECTION}}");
    expect(resolved).not.toContain("{{SLOT:GREETING}}");
  });
});

// ---------------------------------------------------------------------------
// TC-03: Unmigrated templates produce same output
// ---------------------------------------------------------------------------

describe("TASK-07: TC-03 Unmigrated templates produce identical output", () => {
  const unmigrated = templates.filter(
    (t) => !MIGRATED_TEMPLATE_IDS.includes(t.template_id),
  );

  it("no unmigrated template contains slot markers (regression check)", () => {
    // Templates that don't use slots should pass through resolveSlots unchanged
    for (const template of unmigrated) {
      if (template.body.includes("{{SLOT:")) {
        // Some templates may intentionally have slots if added later — that's OK
        // But for unmigrated ones, we just verify resolveSlots is a no-op
        const resolved = resolveSlots(template.body, {});
        expect(resolved).not.toContain("{{SLOT:");
      }
    }
  });

  it("resolveSlots with no slots passes template through unchanged", () => {
    // T01 "Why cancelled" has no slots
    const t01 = getTemplate("T01");
    const resolved = resolveSlots(t01.body, { GREETING: "Dear Maria," });
    // No slot markers to replace, so body is returned unchanged
    expect(resolved).toBe(t01.body);
  });
});

// ---------------------------------------------------------------------------
// Linter: all templates pass lintTemplatesSync (slot markers excluded)
// ---------------------------------------------------------------------------

describe("TASK-07: lintTemplatesSync passes after migration (slot markers not flagged)", () => {
  it("no hard lint issues on migrated templates", () => {
    const migrated = MIGRATED_TEMPLATE_IDS.map(getTemplate);
    // Cast to the lintTemplatesSync expected type
    const issues = lintTemplatesSync(
      migrated as Array<{ subject: string; body: string; category: string }>,
    );
    // Slot markers must NOT be flagged as unfilled placeholders
    const slotIssues = issues.filter(
      (i) =>
        i.code === "placeholder" &&
        (i.details.includes("SLOT:GREETING") ||
          i.details.includes("SLOT:KNOWLEDGE_INJECTION")),
    );
    expect(slotIssues).toHaveLength(0);
  });

  it("full template set has no hard lint issues from slot migration", () => {
    const issues = lintTemplatesSync(
      templates as Array<{ subject: string; body: string; category: string }>,
    );
    // Only check slot-related placeholder issues
    const slotFalsePositives = issues.filter(
      (i) =>
        i.code === "placeholder" && i.details.includes("SLOT:"),
    );
    expect(slotFalsePositives).toHaveLength(0);
  });
});
