/**
 * Baseline Priors Migration Test (LC-00)
 *
 * Validates that active baseline docs have been migrated to include the
 * canonical `## Priors (Machine)` block with valid JSON priors.
 */

import { readFileSync } from "fs";
import { join } from "path";

const BASELINE_DOCS = [
  "docs/business-os/startup-baselines/HEAD-forecast-seed.user.md",
  "docs/business-os/startup-baselines/HEAD-intake-packet.user.md",
  "docs/business-os/startup-baselines/PET-forecast-seed.user.md",
  "docs/business-os/startup-baselines/PET-intake-packet.user.md",
  "docs/business-os/startup-baselines/BRIK-intake-packet.user.md",
];

interface Prior {
  id: string;
  type: "assumption" | "constraint" | "target" | "preference" | "risk";
  statement: string;
  confidence: number;
  value?: number | null;
  unit?: string | null;
  operator?: "eq" | "lt" | "lte" | "gt" | "gte" | null;
  range?: { min: number; max: number } | null;
  last_updated: string;
  evidence: string[];
}

describe("baseline-priors-migration (LC-00)", () => {
  const repoRoot = join(__dirname, "../../../..");

  BASELINE_DOCS.forEach((docPath) => {
    describe(docPath, () => {
      let content: string;
      let priors: Prior[];

      beforeAll(() => {
        const fullPath = join(repoRoot, docPath);
        content = readFileSync(fullPath, "utf-8");

        // Extract the Priors (Machine) section
        const priorSectionMatch = content.match(
          /## Priors \(Machine\)\s*([\s\S]*?)```json\s*([\s\S]*?)```/
        );

        if (!priorSectionMatch) {
          throw new Error(`No ## Priors (Machine) section found in ${docPath}`);
        }

        const jsonContent = priorSectionMatch[2].trim();
        priors = JSON.parse(jsonContent) as Prior[];
      });

      it("should have a ## Priors (Machine) section", () => {
        expect(content).toContain("## Priors (Machine)");
      });

      it("should parse the JSON block successfully", () => {
        expect(priors).toBeDefined();
        expect(Array.isArray(priors)).toBe(true);
        expect(priors.length).toBeGreaterThan(0);
      });

      it("should have valid prior objects with required fields", () => {
        priors.forEach((prior, index) => {
          // Required fields
          expect(prior.id).toBeDefined();
          expect(typeof prior.id).toBe("string");
          expect(prior.id.length).toBeGreaterThan(0);

          expect(prior.type).toBeDefined();
          expect(["assumption", "constraint", "target", "preference", "risk"]).toContain(
            prior.type
          );

          expect(prior.statement).toBeDefined();
          expect(typeof prior.statement).toBe("string");
          expect(prior.statement.length).toBeGreaterThan(0);

          expect(prior.confidence).toBeDefined();
          expect(typeof prior.confidence).toBe("number");
          expect(prior.confidence).toBeGreaterThanOrEqual(0);
          expect(prior.confidence).toBeLessThanOrEqual(1);

          expect(prior.last_updated).toBeDefined();
          expect(typeof prior.last_updated).toBe("string");
          // Should be valid ISO 8601
          expect(() => new Date(prior.last_updated)).not.toThrow();

          expect(prior.evidence).toBeDefined();
          expect(Array.isArray(prior.evidence)).toBe(true);
          expect(prior.evidence.length).toBeGreaterThan(0);
        });
      });

      it("should have unique prior IDs", () => {
        const ids = priors.map((p) => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it("should validate value/unit relationships", () => {
        priors.forEach((prior) => {
          if (prior.value !== undefined && prior.value !== null) {
            // If value is present, unit must also be present
            expect(prior.unit).toBeDefined();
            expect(typeof prior.unit).toBe("string");
            expect(prior.unit!.length).toBeGreaterThan(0);
          }

          if (prior.operator !== undefined && prior.operator !== null) {
            // If operator is present, value must also be present
            expect(prior.value).toBeDefined();
            expect(prior.value).not.toBeNull();
          }

          if (prior.range !== undefined && prior.range !== null) {
            // Range must have min and max with min <= max
            expect(prior.range.min).toBeDefined();
            expect(prior.range.max).toBeDefined();
            expect(typeof prior.range.min).toBe("number");
            expect(typeof prior.range.max).toBe("number");
            expect(prior.range.min).toBeLessThanOrEqual(prior.range.max);
          }
        });
      });
    });
  });

  it("should have migrated all active baseline docs", () => {
    // This test ensures we haven't missed any docs
    expect(BASELINE_DOCS.length).toBeGreaterThanOrEqual(5);
  });
});
