/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { ActivePlanProgress } from "@/lib/process-improvements/active-plans";

import { InProgressInbox } from "./InProgressInbox";

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

describe("InProgressInbox", () => {
  it("TC-07: active plan cards surface the active-now signal from recent file activity", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-12T12:00:00.000Z"));

    try {
      render(
        <InProgressInbox initialActivePlans={[activePlan]} />
      );

      expect(screen.getByRole("heading", { name: "In progress" })).toBeInTheDocument();
      expect(screen.getByText("Active now")).toBeInTheDocument();
      expect(screen.getByText("Touched 1m ago")).toBeInTheDocument();
      expect(screen.getByText("fact-find.md")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("TC-08: active plan cards show a distinct in-flight handoff signal", () => {
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

    expect(screen.getByText("1 handoff in flight")).toBeInTheDocument();
  });

  it("TC-09: active plan cards show recent agent observations only when the matched session is current", () => {
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

      expect(
        screen.getByText("Agent observed 2m ago via lp-do-build")
      ).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
