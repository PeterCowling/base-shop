import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  createStageDoc,
  ensureStageDocsForLane,
  getRequiredStage,
  stageDocExists,
  validateStageDocsForCard,
} from "./lane-transitions";
import { mkdirWithinRoot, readFileWithinRoot, writeFileWithinRoot } from "./safe-fs";
import type { Lane } from "./types";

describe("lane-transitions", () => {
  let repoPath: string;

  beforeEach(async () => {
    repoPath = await fs.mkdtemp(path.join(os.tmpdir(), "lane-transitions-test-"));
    await mkdirWithinRoot(repoPath, path.join(repoPath, "docs/business-os/cards"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    await fs.rm(repoPath, { recursive: true, force: true });
  });

  it("returns no required stage for every lane", () => {
    const lanes: Lane[] = [
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ];

    for (const lane of lanes) {
      expect(getRequiredStage(lane)).toBeNull();
    }
  });

  it("checks canonical stage-doc existence", async () => {
    expect(await stageDocExists(repoPath, "TEST-001", "fact-find", "user")).toBe(false);

    const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-001");
    await mkdirWithinRoot(repoPath, cardDir, { recursive: true });
    await writeFileWithinRoot(
      repoPath,
      path.join(cardDir, "fact-find.user.md"),
      "test content",
      "utf-8"
    );

    expect(await stageDocExists(repoPath, "TEST-001", "fact-find", "user")).toBe(true);
  });

  it("supports legacy filename reads only while dual-read is enabled", async () => {
    const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-LEGACY");
    await mkdirWithinRoot(repoPath, cardDir, { recursive: true });
    await writeFileWithinRoot(
      repoPath,
      path.join(cardDir, "fact-finding.user.md"),
      "legacy content",
      "utf-8"
    );

    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2026-02-14T12:00:00.000Z"));
      expect(await stageDocExists(repoPath, "TEST-LEGACY", "fact-find", "user")).toBe(true);

      jest.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));
      expect(await stageDocExists(repoPath, "TEST-LEGACY", "fact-find", "user")).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it("creates a generic stage doc template", async () => {
    const docPath = await createStageDoc(repoPath, "TEST-001", "fact-find", "user");
    const content = (await readFileWithinRoot(repoPath, docPath, "utf-8")) as string;

    expect(docPath).toContain("TEST-001/fact-find.user.md");
    expect(content).toContain("Type: Stage");
    expect(content).toContain("Stage: fact-find");
    expect(content).toContain("Card-ID: TEST-001");
    expect(content).toContain("# Fact Find");
    expect(content).toContain("Document content pending.");
  });

  it("does not create docs when cards move lanes", async () => {
    expect(await ensureStageDocsForLane(repoPath, "TEST-001", "Inbox")).toEqual([]);
    expect(await ensureStageDocsForLane(repoPath, "TEST-001", "Fact-finding")).toEqual([]);
    expect(await ensureStageDocsForLane(repoPath, "TEST-001", "Done")).toEqual([]);
  });

  it("treats stage-doc validation as advisory and always valid", async () => {
    expect(await validateStageDocsForCard(repoPath, "TEST-001", "Inbox")).toEqual({
      valid: true,
      missingDocs: [],
    });
    expect(await validateStageDocsForCard(repoPath, "TEST-001", "Fact-finding")).toEqual({
      valid: true,
      missingDocs: [],
    });
  });
});
