import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  appendAuditEntry,
  getIdeaById,
  type Idea,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

import { updateIdea } from "../actions";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@/lib/current-user.server-only", () => ({
  getCurrentUserServer: jest.fn(),
}));

jest.mock("@/lib/entity-sha", () => ({
  computeEntitySha: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    appendAuditEntry: jest.fn(),
    getIdeaById: jest.fn(),
    upsertIdea: jest.fn(),
  };
});

const baseIdea: Idea = {
  Type: "Idea",
  ID: "BRIK-OPP-0001",
  Business: "BRIK",
  Status: "raw",
  Priority: "P3",
  "Created-Date": "2026-02-02",
  Tags: ["test"],
  content: "Initial idea content",
  filePath: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
  fileSha: "sha-idea-1",
};

describe("updateIdea", () => {
  const db = { prepare: jest.fn() } as unknown as ReturnType<typeof getDb>;
  const currentUser = { id: "pete", name: "Pete" };

  beforeEach(() => {
    (getDb as jest.Mock).mockReturnValue(db);
    (getCurrentUserServer as jest.Mock).mockResolvedValue(currentUser);
    (computeEntitySha as jest.Mock).mockResolvedValue("sha-updated");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: returns ideaNotFound when idea missing", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(null);

    const result = await updateIdea("BRIK-OPP-0001", "Updated content");

    expect(result).toEqual({
      success: false,
      errorKey: "businessOs.ideas.errors.ideaNotFound",
    });
    expect(upsertIdea).not.toHaveBeenCalled();
  });

  it("TC-02: returns conflict when baseFileSha mismatches", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);

    const result = await updateIdea(
      "BRIK-OPP-0001",
      "Updated content",
      "sha-old"
    );

    expect(result.success).toBe(false);
    expect(result.errorKey).toBe("businessOs.ideas.errors.conflict");
    expect(result.conflict).toEqual({
      currentIdea: baseIdea,
      currentFileSha: "sha-idea-1",
    });
    expect(upsertIdea).not.toHaveBeenCalled();
  });

  it("TC-03: rejects too-short content", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);

    const result = await updateIdea("BRIK-OPP-0001", "short");

    expect(result).toEqual({
      success: false,
      errorKey: "businessOs.ideas.errors.contentTooShort",
    });
    expect(upsertIdea).not.toHaveBeenCalled();
  });

  it("TC-04: updates idea and logs audit entry", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true });

    const result = await updateIdea(
      "BRIK-OPP-0001",
      "Updated idea content"
    );

    expect(result).toEqual({ success: true });
    expect(upsertIdea).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        ID: "BRIK-OPP-0001",
        Status: "worked",
        content: "Updated idea content",
        fileSha: "sha-updated",
      }),
      "worked"
    );
    expect(appendAuditEntry).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        entity_type: "idea",
        entity_id: "BRIK-OPP-0001",
        action: "update",
        actor: "pete",
      })
    );
  });

  it("TC-05: bypasses conflict when force=true", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true });

    const result = await updateIdea(
      "BRIK-OPP-0001",
      "Forced update content",
      "sha-old",
      true
    );

    expect(result).toEqual({ success: true });
    expect(upsertIdea).toHaveBeenCalled();
  });
});
