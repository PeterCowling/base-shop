import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  allocateNextIdeaId,
  appendAuditEntry,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";

import { POST as createIdea } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@/lib/current-user.server-only", () => ({
  getCurrentUserServer: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    allocateNextIdeaId: jest.fn(),
    appendAuditEntry: jest.fn(),
    upsertIdea: jest.fn(),
  };
});

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ideas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/ideas", () => {
  const db = { prepare: jest.fn() } as unknown as ReturnType<typeof getDb>;

  beforeEach(() => {
    (getDb as jest.Mock).mockReturnValue(db);
    (allocateNextIdeaId as jest.Mock).mockResolvedValue("BRIK-OPP-0002");
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true });
    (getCurrentUserServer as jest.Mock).mockResolvedValue({ id: "pete" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: POST /api/ideas defaults priority to P3 when omitted", async () => {
    const response = await createIdea(
      createRequest({
        business: "BRIK",
        content: "Idea without explicit priority",
      })
    );

    expect(response.status).toBe(201);
    const [, createdIdea] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(createdIdea.Priority).toBe("P3");
    expect(appendAuditEntry).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ action: "create", actor: "pete" })
    );
  });

  it("TC-02: POST /api/ideas persists explicit priority", async () => {
    const response = await createIdea(
      createRequest({
        business: "BRIK",
        content: "Idea with explicit priority",
        priority: "P1",
      })
    );

    expect(response.status).toBe(201);
    const [, createdIdea] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(createdIdea.Priority).toBe("P1");
  });

  it("TC-03: POST /api/ideas rejects invalid priority", async () => {
    const response = await createIdea(
      createRequest({
        business: "BRIK",
        content: "Invalid priority",
        priority: "PX",
      })
    );

    expect(response.status).toBe(400);
    expect(upsertIdea).not.toHaveBeenCalled();
  });
});
