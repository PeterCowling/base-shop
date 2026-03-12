import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { performProcessImprovementsDecision } from "@/lib/process-improvements/decision-service";

import { POST } from "./route";

jest.mock("@/lib/current-user.server-only", () => ({
  getCurrentUserServer: jest.fn(),
}));

jest.mock("@/lib/process-improvements/decision-service", () => ({
  performProcessImprovementsDecision: jest.fn(),
}));

describe("POST /api/process-improvements/decision/[decision]", () => {
  beforeEach(() => {
    (getCurrentUserServer as jest.Mock).mockResolvedValue({
      id: "pete",
      name: "Pete",
      email: "pete@business-os.local",
      role: "admin",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: executes a valid do decision for an authorized admin", async () => {
    (performProcessImprovementsDecision as jest.Mock).mockResolvedValue({
      ok: true,
      decision: "do",
      dispatchId: "dispatch-1",
      ideaKey: "idea-1",
      targetPath: "docs/plans/example/fact-find.md",
      targetRoute: "lp-do-fact-find",
    });

    const response = await POST(
      new Request("http://localhost/api/process-improvements/decision/do", {
        method: "POST",
        body: JSON.stringify({ ideaKey: "idea-1", dispatchId: "dispatch-1" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ decision: "do" }) }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      decision: "do",
      dispatchId: "dispatch-1",
      ideaKey: "idea-1",
      targetPath: "docs/plans/example/fact-find.md",
      targetRoute: "lp-do-fact-find",
    });
    expect(performProcessImprovementsDecision).toHaveBeenCalledWith({
      decision: "do",
      dispatchId: "dispatch-1",
      ideaKey: "idea-1",
      actor: expect.objectContaining({ id: "pete" }),
    });
  });

  it("TC-02: rejects invalid decision params before service execution", async () => {
    const response = await POST(
      new Request("http://localhost/api/process-improvements/decision/archive", {
        method: "POST",
        body: JSON.stringify({ ideaKey: "idea-1", dispatchId: "dispatch-1" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ decision: "archive" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_decision" });
    expect(performProcessImprovementsDecision).not.toHaveBeenCalled();
  });

  it("TC-03: rejects unauthorized operators before any decision write", async () => {
    (getCurrentUserServer as jest.Mock).mockResolvedValue({
      id: "avery",
      name: "Avery",
      email: "avery@business-os.local",
      role: "user",
    });

    const response = await POST(
      new Request("http://localhost/api/process-improvements/decision/decline", {
        method: "POST",
        body: JSON.stringify({ ideaKey: "idea-1", dispatchId: "dispatch-1" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ decision: "decline" }) }
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "unauthorized_process_improvements_action",
    });
    expect(performProcessImprovementsDecision).not.toHaveBeenCalled();
  });

  it("TC-05: passes rationale to the decision service when provided", async () => {
    (performProcessImprovementsDecision as jest.Mock).mockResolvedValue({
      ok: true,
      decision: "decline",
      dispatchId: "dispatch-1",
      ideaKey: "idea-1",
    });

    const response = await POST(
      new Request("http://localhost/api/process-improvements/decision/decline", {
        method: "POST",
        body: JSON.stringify({
          ideaKey: "idea-1",
          dispatchId: "dispatch-1",
          rationale: "Not aligned with current goals.",
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ decision: "decline" }) }
    );

    expect(response.status).toBe(200);
    expect(performProcessImprovementsDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        rationale: "Not aligned with current goals.",
      })
    );
  });

  it("TC-04: maps service conflicts to 409 responses", async () => {
    (performProcessImprovementsDecision as jest.Mock).mockResolvedValue({
      ok: false,
      reason: "conflict",
      error: "Dispatch is already processed.",
    });

    const response = await POST(
      new Request("http://localhost/api/process-improvements/decision/do", {
        method: "POST",
        body: JSON.stringify({ ideaKey: "idea-1", dispatchId: "dispatch-1" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ decision: "do" }) }
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "conflict",
      details: "Dispatch is already processed.",
    });
  });
});
