/**
 * Lane transition validation and stage document creation
 *
 * Implements BOS-19: Automatic stage doc creation when cards move between lanes
 */

import path from "path";

import {
  accessWithinRoot,
  mkdirWithinRoot,
  writeFileWithinRoot,
} from "./safe-fs";
import type { Lane, StageType } from "./types";

/**
 * Map lanes to their required stage document types
 */
export const LANE_TO_STAGE: Record<Lane, StageType | null> = {
  Inbox: null, // No stage doc required for Inbox
  "Fact-finding": "fact-find",
  Planned: "plan",
  "In progress": "build",
  Blocked: null, // Inherits from current stage
  Done: "reflect",
  Reflected: "reflect", // Same as Done
};

/**
 * Stage document templates (minimal placeholders)
 */
const STAGE_TEMPLATES = {
  "fact-find": {
    user: (cardId: string) => `---
Type: Stage
Stage: fact-find
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

# Fact-Finding

Fact-finding in progress.

## Questions to Answer

_(To be populated during fact-finding)_

## Findings

_(To be populated with evidence)_

## Recommendations

_(To be completed based on findings)_
`,
    agent: (cardId: string) => `---
Type: Stage
Stage: fact-find
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

## Fact-finding: ${cardId}

**Status:** In progress

**Questions to Answer:**
- _(Agent will populate specific questions during fact-finding)_

**Evidence Gathered:**
- _(Evidence entries with source types will be added here)_

**Recommendations:**
- _(Conclusions and next steps based on findings)_
`,
  },
  plan: {
    user: (cardId: string) => `---
Type: Stage
Stage: plan
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

# Planning

Planning in progress.

## Acceptance Criteria

_(To be defined before moving to In progress)_

## Tasks

_(Atomic tasks will be added here)_

## Dependencies

_(Required dependencies or blockers)_
`,
    agent: (cardId: string) => `---
Type: Stage
Stage: plan
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

## Plan: ${cardId}

**Status:** In progress

**Acceptance Criteria:**
- _(Specific, testable conditions for completion)_

**Tasks (Atomic):**
1. _(Individual implementation steps)_

**Dependencies:**
- _(Other cards or external blockers)_

**Confidence Assessment:**
- Implementation: TBD
- Approach: TBD
- Impact: TBD
`,
  },
  build: {
    user: (cardId: string) => `---
Type: Stage
Stage: build
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

# Build Log

Work in progress.

## Progress

_(Updates as work proceeds)_

## Decisions Made

_(Key implementation decisions)_

## Issues Encountered

_(Blockers or challenges)_
`,
    agent: (cardId: string) => `---
Type: Stage
Stage: build
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

## Build Log: ${cardId}

**Status:** In progress

**Completed:**
- _(Tasks completed from plan)_

**In Progress:**
- _(Current work)_

**Decisions:**
- _(Implementation choices and trade-offs)_

**Issues:**
- _(Blockers or unexpected challenges)_
`,
  },
  reflect: {
    user: (cardId: string) => `---
Type: Stage
Stage: reflect
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

# Reflection

Reflection pending.

## What Worked

_(Successes and positive outcomes)_

## What Didn't Work

_(Challenges and areas for improvement)_

## Learnings

_(Key insights and takeaways)_

## Follow-up Items

_(New cards or actions needed)_
`,
    agent: (cardId: string) => `---
Type: Stage
Stage: reflect
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

## Reflection: ${cardId}

**Completion Date:** ${new Date().toISOString().split("T")[0]}

**Outcomes:**
- _(What was delivered)_

**What Worked:**
- _(Successful approaches and processes)_

**What Didn't Work:**
- _(Challenges faced and lessons learned)_

**Learnings (Technical):**
- _(Technical knowledge gained)_

**Learnings (Process):**
- _(Process improvements identified)_

**Metrics/Impact:**
- _(Measurable outcomes if applicable)_

**Follow-up:**
- _(New cards or actions spawned from this work)_
`,
  },
};

/**
 * Get the stage document type required for a given lane
 */
export function getRequiredStage(lane: Lane): StageType | null {
  return LANE_TO_STAGE[lane];
}

/**
 * Check if a stage document exists for a card
 */
export async function stageDocExists(
  repoPath: string,
  cardId: string,
  stage: StageType,
  audience: "user" | "agent"
): Promise<boolean> {
  const stagePath = path.join(
    repoPath,
    "docs/business-os/cards",
    cardId,
    `${stage}.${audience}.md`
  );

  try {
    await accessWithinRoot(repoPath, stagePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a stage document from template
 */
export async function createStageDoc(
  repoPath: string,
  cardId: string,
  stage: StageType,
  audience: "user" | "agent"
): Promise<string> {
  const template = STAGE_TEMPLATES[stage][audience](cardId);
  const stageDir = path.join(repoPath, "docs/business-os/cards", cardId);
  const stagePath = path.join(stageDir, `${stage}.${audience}.md`);

  // Ensure stage directory exists
  await mkdirWithinRoot(repoPath, stageDir, { recursive: true });

  // Write template
  await writeFileWithinRoot(repoPath, stagePath, template, "utf-8");

  return stagePath;
}

/**
 * Ensure stage documents exist for a lane transition
 *
 * Automatically creates missing stage docs when a card moves to a lane
 * that requires them.
 *
 * @returns Array of created stage doc paths (empty if none created)
 */
export async function ensureStageDocsForLane(
  repoPath: string,
  cardId: string,
  newLane: Lane
): Promise<string[]> {
  const requiredStage = getRequiredStage(newLane);

  // No stage doc required for this lane
  if (!requiredStage) {
    return [];
  }

  const createdDocs: string[] = [];

  // Check and create user doc
  const userExists = await stageDocExists(repoPath, cardId, requiredStage, "user");
  if (!userExists) {
    const userPath = await createStageDoc(repoPath, cardId, requiredStage, "user");
    createdDocs.push(userPath);
  }

  // Check and create agent doc
  const agentExists = await stageDocExists(repoPath, cardId, requiredStage, "agent");
  if (!agentExists) {
    const agentPath = await createStageDoc(repoPath, cardId, requiredStage, "agent");
    createdDocs.push(agentPath);
  }

  return createdDocs;
}

/**
 * Validate that a card has required stage docs for its current lane
 *
 * @returns Object with validation result and missing stages
 */
export async function validateStageDocsForCard(
  repoPath: string,
  cardId: string,
  lane: Lane
): Promise<{
  valid: boolean;
  missingDocs: Array<{ stage: StageType; audience: "user" | "agent" }>;
}> {
  const requiredStage = getRequiredStage(lane);

  if (!requiredStage) {
    return { valid: true, missingDocs: [] };
  }

  const missingDocs: Array<{ stage: StageType; audience: "user" | "agent" }> = [];

  const userExists = await stageDocExists(repoPath, cardId, requiredStage, "user");
  if (!userExists) {
    missingDocs.push({ stage: requiredStage, audience: "user" });
  }

  const agentExists = await stageDocExists(repoPath, cardId, requiredStage, "agent");
  if (!agentExists) {
    missingDocs.push({ stage: requiredStage, audience: "agent" });
  }

  return {
    valid: missingDocs.length === 0,
    missingDocs,
  };
}
