import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { performProcessImprovementsOperatorActionDecision } from "@/lib/process-improvements/operator-action-service";

import { POST } from "./route";

jest.mock("@/lib/current-user.server-only", () => ({
  getCurrentUserServer: jest.fn(),
}));

jest.mock("@/lib/process-improvements/operator-action-service", () => ({
  performProcessImprovementsOperatorActionDecision: jest.fn(),
}));

describe("POST /api/process-improvements/operator-actions/[decision]", () => {
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

  it("TC-01: executes a valid done decision for an authorized admin", async () => {
    (performProcessImprovementsOperatorActionDecision as jest.Mock).mockResolvedValue({
      ok: true,
      decision: "done",
      actionId: "HEAD-BLK-01",
      sourcePath:
        "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
    });

    const response = await POST(
      new Request(
        "http://localhost/api/process-improvements/operator-actions/done",
        {
          method: "POST",
          body: JSON.stringify({ actionId: "HEAD-BLK-01" }),
          headers: { "content-type": "application/json" },
        }
      ),
      { params: Promise.resolve({ decision: "done" }) }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      decision: "done",
      actionId: "HEAD-BLK-01",
      sourcePath:
        "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
    });
    expect(performProcessImprovementsOperatorActionDecision).toHaveBeenCalledWith({
      decision: "done",
      actionId: "HEAD-BLK-01",
      actor: expect.objectContaining({ id: "pete" }),
    });
  });

  it("TC-02: rejects invalid decision params before service execution", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/process-improvements/operator-actions/archive",
        {
          method: "POST",
          body: JSON.stringify({ actionId: "HEAD-BLK-01" }),
          headers: { "content-type": "application/json" },
        }
      ),
      { params: Promise.resolve({ decision: "archive" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_decision" });
    expect(performProcessImprovementsOperatorActionDecision).not.toHaveBeenCalled();
  });

  it("TC-03: rejects unauthorized operators before any decision write", async () => {
    (getCurrentUserServer as jest.Mock).mockResolvedValue({
      id: "avery",
      name: "Avery",
      email: "avery@business-os.local",
      role: "user",
    });

    const response = await POST(
      new Request(
        "http://localhost/api/process-improvements/operator-actions/snooze",
        {
          method: "POST",
          body: JSON.stringify({ actionId: "HEAD-BLK-01" }),
          headers: { "content-type": "application/json" },
        }
      ),
      { params: Promise.resolve({ decision: "snooze" }) }
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "unauthorized_process_improvements_action",
    });
    expect(performProcessImprovementsOperatorActionDecision).not.toHaveBeenCalled();
  });

  it("TC-04: maps service conflicts to 409 responses", async () => {
    (performProcessImprovementsOperatorActionDecision as jest.Mock).mockResolvedValue({
      ok: false,
      reason: "conflict",
      error: "Operator action is already completed.",
    });

    const response = await POST(
      new Request(
        "http://localhost/api/process-improvements/operator-actions/done",
        {
          method: "POST",
          body: JSON.stringify({ actionId: "HEAD-BLK-01" }),
          headers: { "content-type": "application/json" },
        }
      ),
      { params: Promise.resolve({ decision: "done" }) }
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "conflict",
      details: "Operator action is already completed.",
    });
  });
});
