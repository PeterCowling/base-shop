/**
 * @jest-environment jsdom
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { ActivePlanProgress } from "@/lib/process-improvements/active-plans";
import type { ProcessImprovementsInboxItem } from "@/lib/process-improvements/projection";

import { InProgressInbox, LiveNewIdeasCount } from "./InProgressInbox";

const activePlan: ActivePlanProgress = {
  slug: "process-improvements-active-plan-activity-ring",
  title: "Process Improvements Activity Ring",
  summary: "Surface a live signal when an active plan is being touched right now.",
  business: "BOS",
  domain: "BOS",
  executionTrack: "code",
  overallConfidence: "91%",
  created: "2026-03-12",
  lastUpdated: "2026-03-12",
  tasksComplete: 1,
  tasksTotal: 3,
  tasksPending: 2,
  tasksBlocked: 0,
  currentTask: {
    id: "TASK-02",
    type: "IMPLEMENT",
    description: "Render the active ring pulse in the inbox card.",
    status: "pending",
  },
  recentlyCompleted: {
    id: "TASK-01",
    type: "IMPLEMENT",
    description: "Project last-modified activity metadata.",
    status: "complete",
  },
  blockedTasks: [],
  relatedArtifacts: ["fact-find", "analysis"],
  planPath: "docs/plans/process-improvements-active-plan-activity-ring/plan.md",
  lastModifiedAt: "2026-03-12T11:58:30.000Z",
  lastModifiedPath:
    "docs/plans/process-improvements-active-plan-activity-ring/fact-find.md",
  isActiveNow: true,
  lastObservedAt: null,
  lastObservedContextPath: null,
  lastObservedSkillId: null,
  isObservedNow: false,
  hasPendingExecution: false,
  pendingExecutionCount: 0,
};

const activePlanB: ActivePlanProgress = {
  ...activePlan,
  slug: "process-improvements-snooze-buttons",
  title: "Process Improvements Snooze Buttons",
};

const SNOOZE_KEY = "bos:plan-snooze:v1";

function makeMockStorage(initial: Record<string, string> = {}): Storage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  } as unknown as Storage;
}

describe("InProgressInbox", () => {
  it("TC-07: active plan cards surface the active-now signal from recent file activity", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-12T12:00:00.000Z"));

    try {
      render(
        <InProgressInbox initialActivePlans={[activePlan]} />
      );

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "In progress" })).toBeInTheDocument();
      });
      expect(screen.getByText("Active now")).toBeInTheDocument();
      expect(screen.getByText("Touched 1m ago")).toBeInTheDocument();
      expect(screen.getByText("fact-find.md")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("TC-08: active plan cards show a distinct in-flight handoff signal", async () => {
    render(
      <InProgressInbox
        initialActivePlans={[
          {
            ...activePlan,
            hasPendingExecution: true,
            pendingExecutionCount: 1,
            isActiveNow: false,
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("1 handoff in flight")).toBeInTheDocument();
    });
  });

  it("TC-09: active plan cards show recent agent observations only when the matched session is current", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-12T12:00:00.000Z"));

    try {
      render(
        <InProgressInbox
          initialActivePlans={[
            {
              ...activePlan,
              isActiveNow: false,
              lastObservedAt: "2026-03-12T11:57:30.000Z",
              lastObservedContextPath:
                "lp-do-build/process-improvements-active-plan-activity-ring/build-record",
              lastObservedSkillId: "lp-do-build",
              isObservedNow: true,
            },
          ]}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Agent observed 2m ago via lp-do-build")
        ).toBeInTheDocument();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  describe("snooze buttons", () => {
    let mockStorage: Storage;

    beforeEach(() => {
      mockStorage = makeMockStorage();
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("TC-01: snooze buttons render on each active plan card", async () => {
      render(<InProgressInbox initialActivePlans={[activePlan]} />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: "Snooze for 3 days" })).toHaveLength(1);
        expect(screen.getAllByRole("button", { name: "Snooze for 7 days" })).toHaveLength(1);
      });
    });

    it("TC-01 (multi-plan): snooze buttons render on each card independently", async () => {
      render(<InProgressInbox initialActivePlans={[activePlan, activePlanB]} />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: "Snooze for 3 days" })).toHaveLength(2);
        expect(screen.getAllByRole("button", { name: "Snooze for 7 days" })).toHaveLength(2);
      });
    });

    it("TC-02: clicking 'Snooze for 3 days' writes correct expiry to localStorage", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-12T12:00:00.000Z"));
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<InProgressInbox initialActivePlans={[activePlan]} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Snooze for 3 days" })).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Snooze for 3 days" }));
      });

      const raw = mockStorage.getItem(SNOOZE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as Record<string, string>;
      const expiryMs = Date.parse(parsed[activePlan.slug]!);
      const expectedMs = new Date("2026-03-12T12:00:00.000Z").getTime() + 3 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiryMs - expectedMs)).toBeLessThan(1000);
    });

    it("TC-02b: clicking 'Snooze for 7 days' writes correct 7-day expiry to localStorage", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-12T12:00:00.000Z"));
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<InProgressInbox initialActivePlans={[activePlan]} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Snooze for 7 days" })).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Snooze for 7 days" }));
      });

      const raw = mockStorage.getItem(SNOOZE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as Record<string, string>;
      const expiryMs = Date.parse(parsed[activePlan.slug]!);
      const expectedMs = new Date("2026-03-12T12:00:00.000Z").getTime() + 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiryMs - expectedMs)).toBeLessThan(1000);
    });

    it("TC-03: plan with future snooze expiry is absent from the rendered list", async () => {
      const futureExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      mockStorage = makeMockStorage({
        [SNOOZE_KEY]: JSON.stringify({ [activePlan.slug]: futureExpiry }),
      });
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      render(<InProgressInbox initialActivePlans={[activePlan]} />);

      // Wait for mount and snooze filter to apply
      await waitFor(() => {
        expect(screen.queryByText(activePlan.title)).not.toBeInTheDocument();
      });
    });

    it("TC-04: plan with expired snooze is visible in the rendered list", async () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      mockStorage = makeMockStorage({
        [SNOOZE_KEY]: JSON.stringify({ [activePlan.slug]: pastExpiry }),
      });
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      render(<InProgressInbox initialActivePlans={[activePlan]} />);

      await waitFor(() => {
        expect(screen.getByText(activePlan.title)).toBeInTheDocument();
      });
    });

    it("TC-05: stale localStorage entry for unknown slug does not cause errors", async () => {
      mockStorage = makeMockStorage({
        [SNOOZE_KEY]: JSON.stringify({ "unknown-plan-slug-xyz": new Date(Date.now() + 86400000).toISOString() }),
      });
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      render(<InProgressInbox initialActivePlans={[activePlan, activePlanB]} />);

      await waitFor(() => {
        expect(screen.getByText(activePlan.title)).toBeInTheDocument();
        expect(screen.getByText(activePlanB.title)).toBeInTheDocument();
      });
    });

    it("TC-06: null localStorage value causes all plans to render without error", async () => {
      // mockStorage starts empty — getItem returns null by default
      render(<InProgressInbox initialActivePlans={[activePlan, activePlanB]} />);

      await waitFor(() => {
        expect(screen.getByText(activePlan.title)).toBeInTheDocument();
        expect(screen.getByText(activePlanB.title)).toBeInTheDocument();
      });
    });

    it("TC-07 (snooze): when all plans are snoozed, empty-state message is shown", async () => {
      const futureExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      mockStorage = makeMockStorage({
        [SNOOZE_KEY]: JSON.stringify({
          [activePlan.slug]: futureExpiry,
          [activePlanB.slug]: futureExpiry,
        }),
      });
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      render(<InProgressInbox initialActivePlans={[activePlan, activePlanB]} />);

      await waitFor(() => {
        expect(screen.getByText("No plans currently in progress")).toBeInTheDocument();
      });
    });

    it("pre-mount: component renders null before hydration (isMounted guard)", () => {
      // Render synchronously without awaiting any effects
      const { container } = render(<InProgressInbox initialActivePlans={[activePlan]} />);

      // Before effects fire, the component should return null — container is empty
      // (This checks the synchronous render output before act() flushes effects)
      expect(container.firstChild).toBeNull();
    });
  });
});

function makeProcessImprovementItem(
  overrides: Partial<ProcessImprovementsInboxItem> & { dispatchId: string }
): ProcessImprovementsInboxItem {
  return {
    itemType: "process_improvement",
    itemKey: overrides.dispatchId,
    ideaKey: overrides.dispatchId,
    dispatchId: overrides.dispatchId,
    business: "BOS",
    title: `Item ${overrides.dispatchId}`,
    body: "Test body",
    sourcePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
    statusGroup: "active",
    stateLabel: "Awaiting decision",
    priorityBand: 50,
    priorityReason: "Queue backlog",
    isOverdue: false,
    queueState: "enqueued",
    queueMode: "trial",
    locationAnchors: [],
    availableActions: [],
    ...overrides,
  } as ProcessImprovementsInboxItem;
}

describe("LiveNewIdeasCount", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("TC-B4-01: shows count of active items not in progress dispatch IDs", () => {
    const items = [
      makeProcessImprovementItem({ dispatchId: "d-001" }),
      makeProcessImprovementItem({ dispatchId: "d-002" }),
      makeProcessImprovementItem({ dispatchId: "d-003" }),
    ];

    const { container } = render(
      <LiveNewIdeasCount initialItems={items} initialInProgressDispatchIds={[]} />
    );

    expect(container).toHaveTextContent("3");
  });

  it("TC-B4-02: excludes items that are already in-progress dispatch IDs", () => {
    const items = [
      makeProcessImprovementItem({ dispatchId: "d-001" }),
      makeProcessImprovementItem({ dispatchId: "d-002" }),
      makeProcessImprovementItem({ dispatchId: "d-003" }),
    ];

    const { container } = render(
      <LiveNewIdeasCount
        initialItems={items}
        initialInProgressDispatchIds={["d-002"]}
      />
    );

    expect(container).toHaveTextContent("2");
  });

  it("TC-B4-03: updates count on poll response", async () => {
    const initialItems = [
      makeProcessImprovementItem({ dispatchId: "d-001" }),
      makeProcessImprovementItem({ dispatchId: "d-002" }),
    ];

    const updatedItems = [
      makeProcessImprovementItem({ dispatchId: "d-001" }),
      makeProcessImprovementItem({ dispatchId: "d-002" }),
      makeProcessImprovementItem({ dispatchId: "d-003" }),
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: updatedItems,
        inProgressDispatchIds: [],
      }),
    });

    const { container } = render(
      <LiveNewIdeasCount initialItems={initialItems} initialInProgressDispatchIds={[]} />
    );

    expect(container).toHaveTextContent("2");

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(container).toHaveTextContent("3");
    });
  });

  it("TC-B4-04: keeps last known count on API error", async () => {
    const initialItems = [
      makeProcessImprovementItem({ dispatchId: "d-001" }),
      makeProcessImprovementItem({ dispatchId: "d-002" }),
    ];

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { container } = render(
      <LiveNewIdeasCount initialItems={initialItems} initialInProgressDispatchIds={[]} />
    );

    expect(container).toHaveTextContent("2");

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(container).toHaveTextContent("2");
  });
});
