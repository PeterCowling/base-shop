import { describe, expect, it } from "@jest/globals";

import { deriveSubNavCounts } from "./ProcessImprovementsSubNav";

// Minimal type stubs for test fixtures
type StubItem = {
  itemType: "process_improvement" | "operator_action";
  statusGroup: "active" | "deferred" | "resolved";
  dispatchId?: string;
};

type StubPlan = {
  slug: string;
  isActiveNow: boolean;
  tasksTotal: number;
  tasksComplete: number;
};

function makeData(
  items: StubItem[],
  activePlans: StubPlan[],
  inProgressDispatchIds: string[]
) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activePlans: activePlans as any,
    inProgressDispatchIds,
  };
}

describe("deriveSubNavCounts", () => {
  it("TC-SUBNAV-01: returns correct inbox and in-progress counts from API data", () => {
    // 5 active items, 2 of which are in-progress (excluded from inbox)
    const items: StubItem[] = [
      { itemType: "process_improvement", statusGroup: "active", dispatchId: "d1" },
      { itemType: "process_improvement", statusGroup: "active", dispatchId: "d2" },
      { itemType: "process_improvement", statusGroup: "active", dispatchId: "d3" },
      { itemType: "operator_action", statusGroup: "active" },
      { itemType: "operator_action", statusGroup: "active" },
      { itemType: "process_improvement", statusGroup: "deferred", dispatchId: "d4" },
    ];
    const activePlans: StubPlan[] = [
      { slug: "plan-a", isActiveNow: false, tasksTotal: 3, tasksComplete: 1 },
      { slug: "plan-b", isActiveNow: false, tasksTotal: 2, tasksComplete: 2 },
      { slug: "plan-c", isActiveNow: false, tasksTotal: 0, tasksComplete: 0 },
    ];

    const result = deriveSubNavCounts(
      makeData(items, activePlans, ["d1", "d2"])
    );

    // 5 active total - 2 in-progress process_improvement = 3
    expect(result.newIdeasCount).toBe(3);
    // plan-a: incomplete (1 < 3) ✓; plan-b: complete (2 === 2) ✗; plan-c: tasksTotal=0 → included ✓
    expect(result.inProgressCount).toBe(2);
    expect(result.hasActiveNow).toBe(false);
  });

  it("TC-SUBNAV-02: returns zero counts when no active items or plans", () => {
    const result = deriveSubNavCounts(makeData([], [], []));

    expect(result.newIdeasCount).toBe(0);
    expect(result.inProgressCount).toBe(0);
    expect(result.hasActiveNow).toBe(false);
  });

  it("TC-SUBNAV-03: hasActiveNow is true when any plan isActiveNow", () => {
    const activePlans: StubPlan[] = [
      { slug: "plan-a", isActiveNow: false, tasksTotal: 1, tasksComplete: 0 },
      { slug: "plan-b", isActiveNow: true, tasksTotal: 1, tasksComplete: 0 },
    ];

    const result = deriveSubNavCounts(makeData([], activePlans, []));

    expect(result.hasActiveNow).toBe(true);
  });

  it("operator_action items are always counted in inbox regardless of inProgressDispatchIds", () => {
    const items: StubItem[] = [
      { itemType: "operator_action", statusGroup: "active" },
      { itemType: "operator_action", statusGroup: "active" },
    ];

    const result = deriveSubNavCounts(makeData(items, [], ["d1", "d2", "d3"]));

    // operator_action items are never filtered by inProgressDispatchIds
    expect(result.newIdeasCount).toBe(2);
  });

  it("deferred items are excluded from inbox count", () => {
    const items: StubItem[] = [
      { itemType: "process_improvement", statusGroup: "active", dispatchId: "d1" },
      { itemType: "process_improvement", statusGroup: "deferred", dispatchId: "d2" },
      { itemType: "process_improvement", statusGroup: "resolved", dispatchId: "d3" },
    ];

    const result = deriveSubNavCounts(makeData(items, [], []));

    expect(result.newIdeasCount).toBe(1);
  });
});
