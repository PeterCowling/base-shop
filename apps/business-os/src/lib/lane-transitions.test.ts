import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  createStageDoc,
  ensureStageDocsForLane,
  getRequiredStage,
  LANE_TO_STAGE,
  stageDocExists,
  validateStageDocsForCard,
} from "./lane-transitions";
import {
  accessWithinRoot,
  mkdirWithinRoot,
  readFileWithinRoot,
  writeFileWithinRoot,
} from "./safe-fs";
import type { Lane, StageType } from "./types";

describe("lane-transitions", () => {
  let tempDir: string;
  let repoPath: string;

  beforeEach(async () => {
    // Create temp directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lane-transitions-test-"));
    repoPath = tempDir;

    // Create business-os structure
    const docsDir = path.join(repoPath, "docs/business-os");
    await mkdirWithinRoot(repoPath, docsDir, { recursive: true });
    await mkdirWithinRoot(repoPath, path.join(docsDir, "cards"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("LANE_TO_STAGE mapping", () => {
    it("should map lanes to correct stage types", () => {
      expect(LANE_TO_STAGE.Inbox).toBeNull();
      expect(LANE_TO_STAGE["Fact-finding"]).toBe("fact-find");
      expect(LANE_TO_STAGE.Planned).toBe("plan");
      expect(LANE_TO_STAGE["In progress"]).toBe("build");
      expect(LANE_TO_STAGE.Blocked).toBeNull();
      expect(LANE_TO_STAGE.Done).toBe("reflect");
      expect(LANE_TO_STAGE.Reflected).toBe("reflect");
    });

    it("should cover all lane types", () => {
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
        expect(LANE_TO_STAGE).toHaveProperty(lane);
      }
    });
  });

  describe("getRequiredStage", () => {
    it("should return correct stage for lanes that require docs", () => {
      expect(getRequiredStage("Fact-finding")).toBe("fact-find");
      expect(getRequiredStage("Planned")).toBe("plan");
      expect(getRequiredStage("In progress")).toBe("build");
      expect(getRequiredStage("Done")).toBe("reflect");
      expect(getRequiredStage("Reflected")).toBe("reflect");
    });

    it("should return null for lanes without required stage docs", () => {
      expect(getRequiredStage("Inbox")).toBeNull();
      expect(getRequiredStage("Blocked")).toBeNull();
    });
  });

  describe("stageDocExists", () => {
    it("should return false when stage doc does not exist", async () => {
      const exists = await stageDocExists(repoPath, "TEST-001", "fact-find", "user");
      expect(exists).toBe(false);
    });

    it("should return true when stage doc exists", async () => {
      // Create a stage doc
      const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-001");
      await mkdirWithinRoot(repoPath, cardDir, { recursive: true });
      await writeFileWithinRoot(
        repoPath,
        path.join(cardDir, "fact-find.user.md"),
        "test content",
        "utf-8"
      );

      const exists = await stageDocExists(repoPath, "TEST-001", "fact-find", "user");
      expect(exists).toBe(true);
    });

    it("should check both user and agent docs independently", async () => {
      const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-001");
      await mkdirWithinRoot(repoPath, cardDir, { recursive: true });

      // Create only user doc
      await writeFileWithinRoot(
        repoPath,
        path.join(cardDir, "fact-find.user.md"),
        "test content",
        "utf-8"
      );

      const userExists = await stageDocExists(repoPath, "TEST-001", "fact-find", "user");
      const agentExists = await stageDocExists(
        repoPath,
        "TEST-001",
        "fact-find",
        "agent"
      );

      expect(userExists).toBe(true);
      expect(agentExists).toBe(false);
    });
  });

  describe("createStageDoc", () => {
    it("should create fact-find user doc with correct frontmatter", async () => {
      const docPath = await createStageDoc(repoPath, "TEST-001", "fact-find", "user");

      expect(docPath).toContain("TEST-001/fact-find.user.md");

      const content = (await readFileWithinRoot(
        repoPath,
        docPath,
        "utf-8"
      )) as string;
      expect(content).toContain("Type: Stage");
      expect(content).toContain("Stage: fact-find");
      expect(content).toContain("Card-ID: TEST-001");
      expect(content).toContain("Fact-finding in progress");
    });

    it("should create fact-find agent doc with correct structure", async () => {
      const docPath = await createStageDoc(repoPath, "TEST-001", "fact-find", "agent");

      const content = (await readFileWithinRoot(
        repoPath,
        docPath,
        "utf-8"
      )) as string;
      expect(content).toContain("Type: Stage");
      expect(content).toContain("Stage: fact-find");
      expect(content).toContain("Card-ID: TEST-001");
      expect(content).toContain("Questions to Answer");
      expect(content).toContain("Evidence Gathered");
    });

    it("should create plan stage docs", async () => {
      const userPath = await createStageDoc(repoPath, "TEST-001", "plan", "user");
      const agentPath = await createStageDoc(repoPath, "TEST-001", "plan", "agent");

      const userContent = (await readFileWithinRoot(
        repoPath,
        userPath,
        "utf-8"
      )) as string;
      const agentContent = (await readFileWithinRoot(
        repoPath,
        agentPath,
        "utf-8"
      )) as string;

      expect(userContent).toContain("Stage: plan");
      expect(userContent).toContain("Planning in progress");
      expect(userContent).toContain("Acceptance Criteria");

      expect(agentContent).toContain("Stage: plan");
      expect(agentContent).toContain("Confidence Assessment");
    });

    it("should create build stage docs", async () => {
      const userPath = await createStageDoc(repoPath, "TEST-001", "build", "user");
      const agentPath = await createStageDoc(repoPath, "TEST-001", "build", "agent");

      const userContent = (await readFileWithinRoot(
        repoPath,
        userPath,
        "utf-8"
      )) as string;
      const agentContent = (await readFileWithinRoot(
        repoPath,
        agentPath,
        "utf-8"
      )) as string;

      expect(userContent).toContain("Stage: build");
      expect(userContent).toContain("Work in progress");
      expect(userContent).toContain("Progress");

      expect(agentContent).toContain("Stage: build");
      expect(agentContent).toContain("Build Log");
    });

    it("should create reflect stage docs", async () => {
      const userPath = await createStageDoc(repoPath, "TEST-001", "reflect", "user");
      const agentPath = await createStageDoc(repoPath, "TEST-001", "reflect", "agent");

      const userContent = (await readFileWithinRoot(
        repoPath,
        userPath,
        "utf-8"
      )) as string;
      const agentContent = (await readFileWithinRoot(
        repoPath,
        agentPath,
        "utf-8"
      )) as string;

      expect(userContent).toContain("Stage: reflect");
      expect(userContent).toContain("Reflection pending");
      expect(userContent).toContain("What Worked");

      expect(agentContent).toContain("Stage: reflect");
      expect(agentContent).toContain("Learnings");
    });

    it("should create card directory if it doesn't exist", async () => {
      const docPath = await createStageDoc(repoPath, "NEW-CARD", "fact-find", "user");

      expect(docPath).toContain("NEW-CARD/fact-find.user.md");

      // Verify directory was created
      const dirExists = await accessWithinRoot(
        repoPath,
        path.join(repoPath, "docs/business-os/cards/NEW-CARD")
      )
        .then(() => true)
        .catch(() => false);

      expect(dirExists).toBe(true);
    });
  });

  describe("ensureStageDocsForLane", () => {
    it("should create no docs for Inbox lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Inbox");

      expect(created).toHaveLength(0);
    });

    it("should create no docs for Blocked lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Blocked");

      expect(created).toHaveLength(0);
    });

    it("should create both user and agent docs for Fact-finding lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Fact-finding");

      expect(created).toHaveLength(2);
      expect(created[0]).toContain("fact-find.user.md");
      expect(created[1]).toContain("fact-find.agent.md");

      // Verify files exist
      const userExists = await stageDocExists(repoPath, "TEST-001", "fact-find", "user");
      const agentExists = await stageDocExists(
        repoPath,
        "TEST-001",
        "fact-find",
        "agent"
      );

      expect(userExists).toBe(true);
      expect(agentExists).toBe(true);
    });

    it("should create both user and agent docs for Planned lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Planned");

      expect(created).toHaveLength(2);
      expect(created[0]).toContain("plan.user.md");
      expect(created[1]).toContain("plan.agent.md");
    });

    it("should create both user and agent docs for In progress lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "In progress");

      expect(created).toHaveLength(2);
      expect(created[0]).toContain("build.user.md");
      expect(created[1]).toContain("build.agent.md");
    });

    it("should create both user and agent docs for Done lane", async () => {
      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Done");

      expect(created).toHaveLength(2);
      expect(created[0]).toContain("reflect.user.md");
      expect(created[1]).toContain("reflect.agent.md");
    });

    it("should not recreate existing docs", async () => {
      // Create user doc manually
      const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-001");
      await mkdirWithinRoot(repoPath, cardDir, { recursive: true });
      await writeFileWithinRoot(
        repoPath,
        path.join(cardDir, "fact-find.user.md"),
        "existing content",
        "utf-8"
      );

      const created = await ensureStageDocsForLane(repoPath, "TEST-001", "Fact-finding");

      // Should only create agent doc (user already exists)
      expect(created).toHaveLength(1);
      expect(created[0]).toContain("fact-find.agent.md");

      // Verify existing user doc wasn't overwritten
      const userContent = (await readFileWithinRoot(
        repoPath,
        path.join(cardDir, "fact-find.user.md"),
        "utf-8"
      )) as string;
      expect(userContent).toBe("existing content");
    });

    it("should handle multiple lane transitions correctly", async () => {
      // Move through lanes sequentially
      await ensureStageDocsForLane(repoPath, "TEST-001", "Fact-finding");
      await ensureStageDocsForLane(repoPath, "TEST-001", "Planned");
      await ensureStageDocsForLane(repoPath, "TEST-001", "In progress");

      // All stage docs should exist
      const factFindExists = await stageDocExists(
        repoPath,
        "TEST-001",
        "fact-find",
        "user"
      );
      const planExists = await stageDocExists(repoPath, "TEST-001", "plan", "user");
      const buildExists = await stageDocExists(repoPath, "TEST-001", "build", "user");

      expect(factFindExists).toBe(true);
      expect(planExists).toBe(true);
      expect(buildExists).toBe(true);
    });
  });

  describe("validateStageDocsForCard", () => {
    it("should validate successfully when no stage doc required", async () => {
      const result = await validateStageDocsForCard(repoPath, "TEST-001", "Inbox");

      expect(result.valid).toBe(true);
      expect(result.missingDocs).toHaveLength(0);
    });

    it("should detect missing stage docs", async () => {
      const result = await validateStageDocsForCard(
        repoPath,
        "TEST-001",
        "Fact-finding"
      );

      expect(result.valid).toBe(false);
      expect(result.missingDocs).toHaveLength(2);
      expect(result.missingDocs).toEqual([
        { stage: "fact-find", audience: "user" },
        { stage: "fact-find", audience: "agent" },
      ]);
    });

    it("should detect partially missing docs (only user exists)", async () => {
      // Create only user doc
      const cardDir = path.join(repoPath, "docs/business-os/cards/TEST-001");
      await mkdirWithinRoot(repoPath, cardDir, { recursive: true });
      await writeFileWithinRoot(
        repoPath,
        path.join(cardDir, "fact-find.user.md"),
        "test content",
        "utf-8"
      );

      const result = await validateStageDocsForCard(
        repoPath,
        "TEST-001",
        "Fact-finding"
      );

      expect(result.valid).toBe(false);
      expect(result.missingDocs).toHaveLength(1);
      expect(result.missingDocs[0]).toEqual({
        stage: "fact-find",
        audience: "agent",
      });
    });

    it("should validate successfully when all required docs exist", async () => {
      // Create both docs
      await ensureStageDocsForLane(repoPath, "TEST-001", "Fact-finding");

      const result = await validateStageDocsForCard(
        repoPath,
        "TEST-001",
        "Fact-finding"
      );

      expect(result.valid).toBe(true);
      expect(result.missingDocs).toHaveLength(0);
    });

    it("should validate all lane types correctly", async () => {
      const cardId = "TEST-001";

      // Lanes without required docs should be valid
      let result = await validateStageDocsForCard(repoPath, cardId, "Inbox");
      expect(result.valid).toBe(true);

      result = await validateStageDocsForCard(repoPath, cardId, "Blocked");
      expect(result.valid).toBe(true);

      // Lanes with required docs should be invalid (no docs created yet)
      result = await validateStageDocsForCard(repoPath, cardId, "Fact-finding");
      expect(result.valid).toBe(false);

      result = await validateStageDocsForCard(repoPath, cardId, "Planned");
      expect(result.valid).toBe(false);

      result = await validateStageDocsForCard(repoPath, cardId, "In progress");
      expect(result.valid).toBe(false);

      result = await validateStageDocsForCard(repoPath, cardId, "Done");
      expect(result.valid).toBe(false);
    });
  });

  describe("Integration: Full lane transition flow", () => {
    it("should support complete card lifecycle", async () => {
      const cardId = "BRIK-ENG-001";

      // 1. Card starts in Inbox (no docs)
      let created = await ensureStageDocsForLane(repoPath, cardId, "Inbox");
      expect(created).toHaveLength(0);

      // 2. Move to Fact-finding
      created = await ensureStageDocsForLane(repoPath, cardId, "Fact-finding");
      expect(created).toHaveLength(2);

      let validation = await validateStageDocsForCard(repoPath, cardId, "Fact-finding");
      expect(validation.valid).toBe(true);

      // 3. Move to Planned
      created = await ensureStageDocsForLane(repoPath, cardId, "Planned");
      expect(created).toHaveLength(2);

      validation = await validateStageDocsForCard(repoPath, cardId, "Planned");
      expect(validation.valid).toBe(true);

      // 4. Move to In progress
      created = await ensureStageDocsForLane(repoPath, cardId, "In progress");
      expect(created).toHaveLength(2);

      validation = await validateStageDocsForCard(repoPath, cardId, "In progress");
      expect(validation.valid).toBe(true);

      // 5. Move to Done
      created = await ensureStageDocsForLane(repoPath, cardId, "Done");
      expect(created).toHaveLength(2);

      validation = await validateStageDocsForCard(repoPath, cardId, "Done");
      expect(validation.valid).toBe(true);

      // 6. Move to Reflected
      created = await ensureStageDocsForLane(repoPath, cardId, "Reflected");
      // Should not create new docs (same as Done)
      expect(created).toHaveLength(0);

      validation = await validateStageDocsForCard(repoPath, cardId, "Reflected");
      expect(validation.valid).toBe(true);
    });
  });
});
