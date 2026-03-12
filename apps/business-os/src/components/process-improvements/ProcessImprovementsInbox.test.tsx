/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { ProcessImprovementsInboxItem } from "@/lib/process-improvements/projection";

import { ProcessImprovementsInbox } from "./ProcessImprovementsInbox";

const baseItem: ProcessImprovementsInboxItem = {
  ideaKey: "idea-1",
  dispatchId: "dispatch-1",
  business: "BOS",
  title: "Process improvements operator app",
  body: "Turn the passive report into an inbox.",
  queueState: "enqueued",
  status: "fact_find_ready",
  recommendedRoute: "lp-do-fact-find",
  priority: "P1",
  confidence: 0.92,
  createdAt: "2026-03-10T10:00:00.000Z",
  currentTruth: "The operator surface is passive.",
  nextScopeNow: "Build the app inbox.",
  locationAnchors: ["apps/business-os/src/app/process-improvements/page.tsx"],
  sourcePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
  queueMode: "trial",
};

describe("ProcessImprovementsInbox", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as typeof globalThis & { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  it("TC-01: renders enqueued queue-backed items in the awaiting section", () => {
    render(<ProcessImprovementsInbox initialItems={[baseItem]} />);

    expect(screen.getByText("Awaiting decision")).toBeInTheDocument();
    expect(screen.getByText(baseItem.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Defer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });

  it("TC-02: successful defer moves the item into the deferred section", async () => {
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

    render(<ProcessImprovementsInbox initialItems={[baseItem]} />);

    await user.click(screen.getByRole("button", { name: "Defer" }));

    await waitFor(() => {
      expect(screen.getByText(/Deferred until/i)).toBeInTheDocument();
    });
  });

  it("TC-03: successful do removes the item from awaiting and records a recent action", async () => {
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

    render(<ProcessImprovementsInbox initialItems={[baseItem]} />);

    await user.click(screen.getByRole("button", { name: "Do" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "docs/plans/process-improvements-operator-app/fact-find.md"
        )
      ).toBeInTheDocument();
    });
  });
});
