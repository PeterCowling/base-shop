import { describe, expect, it } from "@jest/globals";

import {
  detectCycles,
  getDependencyDepth,
  getDependents,
  topologicalSort,
  validateDependencies,
  wouldCreateCycle,
} from "./dependencies";
import type { Card } from "./types";

// Helper to create minimal card for testing
function createCard(id: string, dependencies?: string[]): Card {
  return {
    Type: "Card",
    Lane: "Inbox",
    Priority: "P3",
    Owner: "Test",
    ID: id,
    Dependencies: dependencies,
    content: "",
    filePath: "",
  };
}

describe("dependencies", () => {
  describe("detectCycles", () => {
    it("should return empty array when no cycles exist (A→B→C)", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", []),
      ];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(0);
    });

    it("should detect simple cycle (A→B→A)", () => {
      const cards = [createCard("A", ["B"]), createCard("B", ["A"])];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toEqual(["A", "B", "A"]);
      expect(cycles[0].description).toBe("A → B → A");
    });

    it("should detect complex cycle (A→B→C→A)", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", ["A"]),
      ];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toEqual(["A", "B", "C", "A"]);
      expect(cycles[0].description).toBe("A → B → C → A");
    });

    it("should detect multiple independent cycles", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["A"]),
        createCard("C", ["D"]),
        createCard("D", ["C"]),
        createCard("E", []), // Unrelated card
      ];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(2);

      // Check both cycles are detected (order may vary)
      const cycleStrings = cycles.map((c) => c.description);
      expect(cycleStrings).toContain("A → B → A");
      expect(cycleStrings).toContain("C → D → C");
    });

    it("should detect self-loop (A→A)", () => {
      const cards = [createCard("A", ["A"])];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toEqual(["A", "A"]);
      expect(cycles[0].description).toBe("A → A (self-loop)");
    });

    it("should detect cross-business dependency cycles", () => {
      const cards = [
        createCard("BRIK-001", ["PLAT-002"]),
        createCard("PLAT-002", ["BRIK-001"]),
      ];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toEqual(["BRIK-001", "PLAT-002", "BRIK-001"]);
      expect(cycles[0].description).toBe("BRIK-001 → PLAT-002 → BRIK-001");
    });

    it("should handle cards with no dependencies", () => {
      const cards = [createCard("A", []), createCard("B", []), createCard("C", [])];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(0);
    });

    it("should handle empty cards array", () => {
      const cycles = detectCycles([]);

      expect(cycles).toHaveLength(0);
    });

    it("should handle complex graph with multiple paths", () => {
      // A→B, A→C, B→D, C→D (diamond shape, no cycle)
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", ["D"]),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      const cycles = detectCycles(cards);

      expect(cycles).toHaveLength(0);
    });

    it("should detect nested cycles", () => {
      // A→B→C→A (outer cycle) and B→D→B (inner cycle)
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C", "D"]),
        createCard("C", ["A"]),
        createCard("D", ["B"]),
      ];

      const cycles = detectCycles(cards);

      expect(cycles.length).toBeGreaterThanOrEqual(2);

      // Check that both cycles are detected
      const cycleStrings = cycles.map((c) => c.description);
      expect(cycleStrings.some((s) => s.includes("A"))).toBe(true);
      expect(cycleStrings.some((s) => s.includes("D"))).toBe(true);
    });
  });

  describe("wouldCreateCycle", () => {
    it("should return false when adding dependency creates no cycle", () => {
      const cards = [createCard("A", []), createCard("B", [])];

      const result = wouldCreateCycle(cards, "A", "B");

      expect(result).toBe(false);
    });

    it("should return true when adding dependency creates cycle", () => {
      const cards = [createCard("A", ["B"]), createCard("B", [])];

      const result = wouldCreateCycle(cards, "B", "A");

      expect(result).toBe(true);
    });

    it("should return true when adding self-loop", () => {
      const cards = [createCard("A", [])];

      const result = wouldCreateCycle(cards, "A", "A");

      expect(result).toBe(true);
    });

    it("should return true for transitive cycle", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", []),
      ];

      const result = wouldCreateCycle(cards, "C", "A");

      expect(result).toBe(true);
    });

    it("should return false for diamond dependencies", () => {
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", []),
        createCard("C", []),
      ];

      const result = wouldCreateCycle(cards, "B", "D");

      expect(result).toBe(false);
    });
  });

  describe("validateDependencies", () => {
    it("should validate successfully when no issues", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", []),
      ];

      const validation = validateDependencies(cards);

      expect(validation.valid).toBe(true);
      expect(validation.cycles).toHaveLength(0);
      expect(validation.missingDependencies).toHaveLength(0);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect missing dependencies", () => {
      const cards = [createCard("A", ["B", "MISSING"]), createCard("B", [])];

      const validation = validateDependencies(cards);

      expect(validation.valid).toBe(false);
      expect(validation.missingDependencies).toHaveLength(1);
      expect(validation.missingDependencies[0]).toEqual({
        cardId: "A",
        missingDepId: "MISSING",
      });
      expect(validation.errors[0]).toContain("non-existent card MISSING");
    });

    it("should detect cycles", () => {
      const cards = [createCard("A", ["B"]), createCard("B", ["A"])];

      const validation = validateDependencies(cards);

      expect(validation.valid).toBe(false);
      expect(validation.cycles).toHaveLength(1);
      expect(validation.errors[0]).toContain("Dependency cycle detected");
    });

    it("should detect both missing dependencies and cycles", () => {
      const cards = [
        createCard("A", ["B", "MISSING"]),
        createCard("B", ["A"]),
      ];

      const validation = validateDependencies(cards);

      expect(validation.valid).toBe(false);
      expect(validation.missingDependencies).toHaveLength(1);
      expect(validation.cycles).toHaveLength(1);
      expect(validation.errors).toHaveLength(2);
    });

    it("should validate cards with no dependencies", () => {
      const cards = [createCard("A", []), createCard("B", undefined)];

      const validation = validateDependencies(cards);

      expect(validation.valid).toBe(true);
    });
  });

  describe("getDependents", () => {
    it("should return cards that depend on given card", () => {
      const cards = [
        createCard("A", ["C"]),
        createCard("B", ["C"]),
        createCard("C", []),
        createCard("D", ["E"]),
      ];

      const dependents = getDependents(cards, "C");

      expect(dependents).toHaveLength(2);
      expect(dependents).toContain("A");
      expect(dependents).toContain("B");
    });

    it("should return empty array when no dependents", () => {
      const cards = [createCard("A", []), createCard("B", ["A"])];

      const dependents = getDependents(cards, "B");

      expect(dependents).toHaveLength(0);
    });

    it("should handle cards with no dependencies field", () => {
      const cards = [createCard("A", undefined), createCard("B", undefined)];

      const dependents = getDependents(cards, "A");

      expect(dependents).toHaveLength(0);
    });

    it("should return multiple dependents correctly", () => {
      const cards = [
        createCard("A", ["D"]),
        createCard("B", ["D"]),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      const dependents = getDependents(cards, "D");

      expect(dependents).toHaveLength(3);
      expect(dependents).toEqual(expect.arrayContaining(["A", "B", "C"]));
    });
  });

  describe("getDependencyDepth", () => {
    it("should return 0 for card with no dependencies", () => {
      const cards = [createCard("A", [])];

      const depth = getDependencyDepth(cards, "A");

      expect(depth).toBe(0);
    });

    it("should return 1 for card with one dependency", () => {
      const cards = [createCard("A", ["B"]), createCard("B", [])];

      const depth = getDependencyDepth(cards, "A");

      expect(depth).toBe(1);
    });

    it("should return correct depth for chain", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      expect(getDependencyDepth(cards, "A")).toBe(3);
      expect(getDependencyDepth(cards, "B")).toBe(2);
      expect(getDependencyDepth(cards, "C")).toBe(1);
      expect(getDependencyDepth(cards, "D")).toBe(0);
    });

    it("should return max depth for multiple dependencies", () => {
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", ["D"]),
        createCard("C", []),
        createCard("D", []),
      ];

      const depth = getDependencyDepth(cards, "A");

      // A depends on B (depth 1) and C (depth 0), so A has depth 2
      expect(depth).toBe(2);
    });

    it("should return -1 for cycles", () => {
      const cards = [createCard("A", ["B"]), createCard("B", ["A"])];

      const depth = getDependencyDepth(cards, "A");

      expect(depth).toBe(-1);
    });

    it("should return -1 for self-loop", () => {
      const cards = [createCard("A", ["A"])];

      const depth = getDependencyDepth(cards, "A");

      expect(depth).toBe(-1);
    });

    it("should cache depth calculations", () => {
      // Diamond shape - D is reachable via two paths
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", ["D"]),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      const depth = getDependencyDepth(cards, "A");

      expect(depth).toBe(2);
    });
  });

  describe("topologicalSort", () => {
    it("should sort cards with dependencies before dependents", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", ["C"]),
        createCard("C", []),
      ];

      const sorted = topologicalSort(cards);

      const indexA = sorted.findIndex((c) => c.ID === "A");
      const indexB = sorted.findIndex((c) => c.ID === "B");
      const indexC = sorted.findIndex((c) => c.ID === "C");

      // C should come before B, B before A
      expect(indexC).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexA);
    });

    it("should handle cards with no dependencies", () => {
      const cards = [createCard("A", []), createCard("B", []), createCard("C", [])];

      const sorted = topologicalSort(cards);

      expect(sorted).toHaveLength(3);
      // All orders are valid since there are no dependencies
    });

    it("should handle diamond dependencies", () => {
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", ["D"]),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      const sorted = topologicalSort(cards);

      const indexA = sorted.findIndex((c) => c.ID === "A");
      const indexD = sorted.findIndex((c) => c.ID === "D");

      // D must come before A
      expect(indexD).toBeLessThan(indexA);
    });

    it("should throw error when cycles exist", () => {
      const cards = [createCard("A", ["B"]), createCard("B", ["A"])];

      expect(() => topologicalSort(cards)).toThrow("cycles detected");
    });

    it("should handle disconnected components", () => {
      const cards = [
        createCard("A", ["B"]),
        createCard("B", []),
        createCard("C", ["D"]),
        createCard("D", []),
      ];

      const sorted = topologicalSort(cards);

      expect(sorted).toHaveLength(4);

      // Within each component, dependencies should come first
      const indexA = sorted.findIndex((c) => c.ID === "A");
      const indexB = sorted.findIndex((c) => c.ID === "B");
      const indexC = sorted.findIndex((c) => c.ID === "C");
      const indexD = sorted.findIndex((c) => c.ID === "D");

      expect(indexB).toBeLessThan(indexA);
      expect(indexD).toBeLessThan(indexC);
    });

    it("should handle complex dependency tree", () => {
      const cards = [
        createCard("A", ["B", "C"]),
        createCard("B", ["D", "E"]),
        createCard("C", ["E"]),
        createCard("D", ["F"]),
        createCard("E", ["F"]),
        createCard("F", []),
      ];

      const sorted = topologicalSort(cards);

      const indices = new Map(sorted.map((c, i) => [c.ID, i]));

      // Verify all dependencies come before dependents
      expect(indices.get("F")!).toBeLessThan(indices.get("D")!);
      expect(indices.get("F")!).toBeLessThan(indices.get("E")!);
      expect(indices.get("D")!).toBeLessThan(indices.get("B")!);
      expect(indices.get("E")!).toBeLessThan(indices.get("B")!);
      expect(indices.get("E")!).toBeLessThan(indices.get("C")!);
      expect(indices.get("B")!).toBeLessThan(indices.get("A")!);
      expect(indices.get("C")!).toBeLessThan(indices.get("A")!);
    });
  });

  describe("Integration: Full dependency scenarios", () => {
    it("should handle cross-business dependencies correctly", () => {
      const cards = [
        createCard("BRIK-001", ["PLAT-001"]),
        createCard("BRIK-002", ["BRIK-001"]),
        createCard("PLAT-001", []),
        createCard("SKYL-001", ["PLAT-001"]),
      ];

      const validation = validateDependencies(cards);
      expect(validation.valid).toBe(true);

      const sorted = topologicalSort(cards);
      const indices = new Map(sorted.map((c, i) => [c.ID, i]));

      // PLAT-001 should come first
      expect(indices.get("PLAT-001")!).toBe(0);

      // Check dependents come after dependencies
      expect(indices.get("PLAT-001")!).toBeLessThan(indices.get("BRIK-001")!);
      expect(indices.get("BRIK-001")!).toBeLessThan(indices.get("BRIK-002")!);
      expect(indices.get("PLAT-001")!).toBeLessThan(indices.get("SKYL-001")!);
    });

    it("should handle large dependency graph efficiently", () => {
      // Create a large tree: root with 10 children, each with 10 grandchildren
      const cards: Card[] = [];

      cards.push(createCard("ROOT", []));

      for (let i = 0; i < 10; i++) {
        const childId = `CHILD-${i}`;
        cards.push(createCard(childId, ["ROOT"]));

        for (let j = 0; j < 10; j++) {
          const grandchildId = `GRAND-${i}-${j}`;
          cards.push(createCard(grandchildId, [childId]));
        }
      }

      // Should complete in reasonable time (< 100ms for 111 cards)
      const start = Date.now();
      const validation = validateDependencies(cards);
      const duration = Date.now() - start;

      expect(validation.valid).toBe(true);
      expect(duration).toBeLessThan(100);
      expect(cards.length).toBe(111);
    });
  });
});
