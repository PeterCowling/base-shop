import {
  analyzeDependencyGraph,
  DependencyGraphValidationError,
} from "../../../src/math/graph";

describe("analyzeDependencyGraph", () => {
  it("TC-02-01: derives deterministic topology and bottleneck summaries", () => {
    const result = analyzeDependencyGraph({
      nodes: [{ id: "ideas" }, { id: "fact-find" }, { id: "plan" }, { id: "build" }],
      edges: [
        { from: "ideas", to: "fact-find" },
        { from: "fact-find", to: "plan" },
        { from: "plan", to: "build" },
      ],
    });

    expect(result.node_ids).toEqual(["build", "fact-find", "ideas", "plan"]);
    expect(result.edge_count).toBe(3);
    expect(result.roots).toEqual(["ideas"]);
    expect(result.leaves).toEqual(["build"]);
    expect(result.topological_order).toEqual(["ideas", "fact-find", "plan", "build"]);
    expect(result.generations).toEqual([
      ["ideas"],
      ["fact-find"],
      ["plan"],
      ["build"],
    ]);
    expect(result.critical_path).toEqual({
      length: 3,
      node_ids: ["ideas", "fact-find", "plan", "build"],
    });
    expect(result.bottleneck_scores.map((entry) => entry.node_id)).toEqual([
      "fact-find",
      "plan",
      "build",
      "ideas",
    ]);
    expect(result.bottleneck_scores[0]?.score).toBeGreaterThan(
      result.bottleneck_scores[2]?.score ?? 0,
    );
  });

  it("TC-02-02: rejects edges that point to missing nodes", () => {
    expect(() =>
      analyzeDependencyGraph({
        nodes: [{ id: "ideas" }],
        edges: [{ from: "ideas", to: "plan" }],
      }),
    ).toThrow(new DependencyGraphValidationError("unknown_edge_to:plan"));
  });

  it("TC-02-03: fails closed on cyclic graphs", () => {
    expect(() =>
      analyzeDependencyGraph({
        nodes: [{ id: "a" }, { id: "b" }],
        edges: [
          { from: "a", to: "b" },
          { from: "b", to: "a" },
        ],
      }),
    ).toThrow(new DependencyGraphValidationError("graph_contains_cycle"));
  });
});
