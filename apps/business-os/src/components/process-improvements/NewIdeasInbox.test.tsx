/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type {
  ProcessImprovementQueueInboxItem,
  ProcessImprovementsOperatorActionItem,
  ProcessImprovementsRecentAction,
} from "@/lib/process-improvements/projection";

import { NewIdeasInbox } from "./NewIdeasInbox";

const queueActions = [
  { decision: "do" as const, label: "Do", variant: "primary" as const },
  { decision: "defer" as const, label: "Defer", variant: "secondary" as const },
  { decision: "decline" as const, label: "Decline", variant: "danger" as const },
];

const operatorActions = [
  {
    decision: "done" as const,
    label: "Mark done",
    variant: "primary" as const,
  },
  { decision: "snooze" as const, label: "Snooze", variant: "secondary" as const },
];

const baseItem: ProcessImprovementQueueInboxItem = {
  itemType: "process_improvement",
  itemKey: "idea-1",
  ideaKey: "idea-1",
  dispatchId: "dispatch-1",
  business: "BOS",
  title: "Process improvements operator app",
  body: "Turn the passive report into an inbox.",
  sourcePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
  statusGroup: "active",
  stateLabel: "Awaiting decision",
  priorityBand: 50,
  priorityReason: "Queue backlog P1",
  isOverdue: false,
  createdAt: "2026-03-10T10:00:00.000Z",
  sourceLabel: "dispatch-1",
  locationAnchors: ["apps/business-os/src/app/process-improvements/page.tsx"],
  availableActions: queueActions,
  queueState: "enqueued",
  status: "fact_find_ready",
  recommendedRoute: "lp-do-fact-find",
  priority: "P1",
  confidence: 0.92,
  currentTruth: "The operator surface is passive.",
  nextScopeNow: "Build the app inbox.",
  queueMode: "trial",
};

const deferredQueueItem: ProcessImprovementQueueInboxItem = {
  ...baseItem,
  itemKey: "idea-2",
  ideaKey: "idea-2",
  dispatchId: "dispatch-2",
  title: "Deferred queue item",
  statusGroup: "deferred",
  stateLabel: "Deferred",
  priorityBand: 80,
  priorityReason: "Deferred queue item",
  decisionState: {
    decision: "defer",
    decidedAt: "2026-03-11T12:00:00.000Z",
    deferUntil: "2026-03-18T10:00:00.000Z",
  },
};

const operatorActionItem: ProcessImprovementsOperatorActionItem = {
  itemType: "operator_action",
  itemKey: "HEAD-BLK-01",
  actionId: "HEAD-BLK-01",
  actionKind: "blocker",
  business: "HEAD",
  title: "Brand name decision from Nidilo shortlist",
  body: "Choose the launch brand name so identity and storefront work can settle.",
  sourcePath:
    "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
  sourceLabel: "docs/business-os/startup-loop/operator-actions.json",
  statusGroup: "active",
  stateLabel: "Open",
  priorityBand: 0,
  priorityReason: "Overdue blocker",
  isOverdue: true,
  dueAt: "2026-02-27",
  owner: "Pete",
  locationAnchors: [],
  availableActions: operatorActions,
};

const snoozedOperatorActionItem: ProcessImprovementsOperatorActionItem = {
  ...operatorActionItem,
  itemKey: "HEAD-NEXT-01",
  actionId: "HEAD-NEXT-01",
  actionKind: "next_step",
  title: "Snoozed operator follow-up",
  statusGroup: "deferred",
  stateLabel: "Snoozed",
  priorityBand: 80,
  priorityReason: "Snoozed operator action",
  isOverdue: false,
  decisionState: {
    decision: "snooze",
    decidedAt: "2026-03-11T12:00:00.000Z",
    snoozeUntil: "2026-03-18T10:00:00.000Z",
  },
};

const recentOperatorAction: ProcessImprovementsRecentAction = {
  itemKey: "HEAD-BLK-01",
  title: "Brand name decision from Nidilo shortlist",
  business: "HEAD",
  decision: "done",
  actedAt: "2026-03-11T12:00:00.000Z",
  targetPath:
    "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
  itemType: "operator_action",
};

describe("NewIdeasInbox", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as typeof globalThis & { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  it("TC-01: renders one prioritized active worklist across queue and operator items", () => {
    render(
      <NewIdeasInbox
        initialItems={[baseItem, operatorActionItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "New ideas" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Operator actions" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Awaiting decision" })
    ).not.toBeInTheDocument();

    const operatorHeading = screen.getByRole("heading", {
      level: 3,
      name: operatorActionItem.title,
    });
    const queueHeading = screen.getByRole("heading", {
      level: 3,
      name: baseItem.title,
    });

    expect(
      operatorHeading.compareDocumentPosition(queueHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByText("Business HEAD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark done" })).toBeInTheDocument();
  });

  it("TC-02: successful defer moves a queue item into the shared deferred section", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        decision: "defer",
        dispatchId: "dispatch-1",
        ideaKey: "idea-1",
        deferUntil: "2026-03-17T10:00:00.000Z",
      }),
    });

    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Defer" }));

    await waitFor(() => {
      expect(screen.getByText(/Deferred until/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Deferred" })).toBeInTheDocument();
  });

  it("TC-03: successful do removes a queue item from the active worklist and records a recent action", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        decision: "do",
        dispatchId: "dispatch-1",
        ideaKey: "idea-1",
        targetPath: "docs/plans/process-improvements-operator-app/fact-find.md",
        targetRoute: "lp-do-fact-find",
      }),
    });

    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Do" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "docs/plans/process-improvements-operator-app/fact-find.md"
        )
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { level: 3, name: baseItem.title })
    ).not.toBeInTheDocument();
  });

  it("TC-04: successful snooze moves an operator action into the shared deferred section", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        decision: "snooze",
        actionId: "HEAD-BLK-01",
        snoozeUntil: "2026-03-18T10:00:00.000Z",
      }),
    });

    render(
      <NewIdeasInbox
        initialItems={[operatorActionItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Snooze" }));

    await waitFor(() => {
      expect(screen.getByText(/Snoozed until/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "Snoozed operator actions" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deferred" })).toBeInTheDocument();
  });

  it("TC-05: recent completed operator actions persist in the recent section", () => {
    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[recentOperatorAction]}
        initialInProgressDispatchIds={[]}
      />
    );

    expect(screen.getByText("Recently actioned")).toBeInTheDocument();
    expect(
      screen.getByText("Brand name decision from Nidilo shortlist")
    ).toBeInTheDocument();
    expect(screen.getByText(/HEAD · done at/i)).toBeInTheDocument();
  });

  it("TC-06: pre-deferred queue and snoozed operator items share one deferred section", () => {
    render(
      <NewIdeasInbox
        initialItems={[deferredQueueItem, snoozedOperatorActionItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "Deferred" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: deferredQueueItem.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: snoozedOperatorActionItem.title,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Deferred until/i)).toBeInTheDocument();
    expect(screen.getByText(/Snoozed until/i)).toBeInTheDocument();
  });

  const itemWithDecisionBrief: ProcessImprovementQueueInboxItem = {
    ...baseItem,
    itemKey: "idea-brief-1",
    ideaKey: "idea-brief-1",
    dispatchId: "dispatch-brief-1",
    title: "Improve operator decision surface",
    decisionBrief: {
      problem: "The operator inbox is passive.",
      whyNow: "Operators miss critical items without active prompting.",
      businessBenefit:
        "Acting on this reduces the risk of broken behaviour, data errors, or customer-facing failures.",
      benefitCategory: "risk_reduction",
      expectedNextStep: "Work starts immediately once you approve.",
      confidenceExplainer:
        "High confidence — the analysis is solid and the outcome is likely.",
      evidenceLabels: [
        {
          label: "Operator observation",
          raw: "operator-stated: customer reported bug",
        },
      ],
    },
  };

  it("TC-NEW-01: DecisionBriefPanel renders when item has a decisionBrief", () => {
    render(
      <NewIdeasInbox
        initialItems={[itemWithDecisionBrief]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    expect(screen.getByText("Why this matters now")).toBeInTheDocument();
    expect(screen.getByText("Business benefit")).toBeInTheDocument();
    expect(screen.getByText("If you press Do")).toBeInTheDocument();
  });

  it("TC-NEW-02: Evidence & details toggle shows evidence labels", async () => {
    const user = userEvent.setup();

    render(
      <NewIdeasInbox
        initialItems={[itemWithDecisionBrief]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    // Click "Evidence & details" toggle button to reveal evidence
    await user.click(screen.getByRole("button", { name: /Evidence & details/i }));

    await waitFor(() => {
      expect(screen.getByText("operator-stated: customer reported bug")).toBeInTheDocument();
    });
  });

  it("TC-NEW-03: Decline button shows rationale input before firing the API", async () => {
    const user = userEvent.setup();

    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decline" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Note \(optional\)/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Confirm decline" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-NEW-04: Decline confirm fires the API with rationale in the request body", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        decision: "decline",
        dispatchId: "dispatch-1",
        ideaKey: "idea-1",
      }),
    });

    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decline" }));

    const textarea = await screen.findByPlaceholderText(/Optional reason/i);
    await user.type(textarea, "Not relevant this quarter");

    await user.click(screen.getByRole("button", { name: "Confirm decline" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, fetchInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(fetchInit.body as string) as Record<string, unknown>;
    expect(body.rationale).toBe("Not relevant this quarter");
  });

  it("TC-NEW-05: recent queue actions with decision do appear in the recently-actioned section", () => {
    const recentQueueAction: ProcessImprovementsRecentAction = {
      itemKey: "idea-recent-1",
      title: "Improve dispatch routing accuracy",
      business: "BRIK",
      decision: "do",
      actedAt: "2026-03-12T09:00:00.000Z",
      itemType: "process_improvement",
      rationale: undefined,
    };

    render(
      <NewIdeasInbox
        initialItems={[baseItem]}
        initialRecentActions={[recentQueueAction]}
        initialInProgressDispatchIds={[]}
      />
    );

    expect(screen.getByText("Recently actioned")).toBeInTheDocument();
    expect(
      screen.getByText("Improve dispatch routing accuracy")
    ).toBeInTheDocument();
    expect(screen.getByText(/BRIK · do at/i)).toBeInTheDocument();
  });
});

describe("formatPriorityLabel", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as typeof globalThis & { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  it("TC-B5-01: maps known internal label to plain language", async () => {
    const user = userEvent.setup();
    const p2Item: ProcessImprovementQueueInboxItem = {
      ...baseItem,
      itemKey: "idea-b5-01",
      ideaKey: "idea-b5-01",
      dispatchId: "dispatch-b5-01",
      title: "B5-01 test item",
      priorityReason: "Queue backlog P2",
    };

    render(
      <NewIdeasInbox
        initialItems={[p2Item]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    // Expand the card by clicking its title
    await user.click(screen.getByRole("heading", { level: 3, name: "B5-01 test item" }));

    await waitFor(() => {
      expect(screen.getByText("Standard priority")).toBeInTheDocument();
    });
    expect(screen.queryByText("Queue backlog P2")).not.toBeInTheDocument();
  });

  it("TC-B5-02: maps Active decision_waiting label", async () => {
    const user = userEvent.setup();
    const activeItem: ProcessImprovementQueueInboxItem = {
      ...baseItem,
      itemKey: "idea-b5-02",
      ideaKey: "idea-b5-02",
      dispatchId: "dispatch-b5-02",
      title: "B5-02 test item",
      priorityReason: "Active blocker",
    };

    render(
      <NewIdeasInbox
        initialItems={[activeItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("heading", { level: 3, name: "B5-02 test item" }));

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
    expect(screen.queryByText("Active blocker")).not.toBeInTheDocument();
  });

  it("TC-B5-03: unknown label falls back to raw value", async () => {
    const user = userEvent.setup();
    const unknownItem: ProcessImprovementQueueInboxItem = {
      ...baseItem,
      itemKey: "idea-b5-03",
      ideaKey: "idea-b5-03",
      dispatchId: "dispatch-b5-03",
      title: "B5-03 test item",
      priorityReason: "some_unknown_value",
    };

    render(
      <NewIdeasInbox
        initialItems={[unknownItem]}
        initialRecentActions={[]}
        initialInProgressDispatchIds={[]}
      />
    );

    await user.click(screen.getByRole("heading", { level: 3, name: "B5-03 test item" }));

    await waitFor(() => {
      expect(screen.getByText("some_unknown_value")).toBeInTheDocument();
    });
  });
});
