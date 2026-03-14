/**
 * Lane transition helpers
 *
 * Business OS cards no longer enforce a startup-loop stage model.
 * Card-attached documents are optional and workflow-agnostic, so lane changes
 * do not create or require specific docs.
 */

import path from "path";

import {
  accessWithinRoot,
  mkdirWithinRoot,
  writeFileWithinRoot,
} from "./safe-fs";
import type { Lane, StageType } from "./types";

export function getRequiredStage(_lane: Lane): StageType | null {
  return null;
}

export async function stageDocExists(
  repoPath: string,
  cardId: string,
  stage: StageType,
  audience: "user" | "agent"
): Promise<boolean> {
  const canonicalPath = path.join(
    repoPath,
    "docs/business-os/cards",
    cardId,
    `${stage}.${audience}.md`
  );

  try {
    await accessWithinRoot(repoPath, canonicalPath);
    return true;
  } catch {
    return false;
  }
}

export async function createStageDoc(
  repoPath: string,
  cardId: string,
  stage: StageType,
  audience: "user" | "agent"
): Promise<string> {
  const label = stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const template = `---
Type: Stage
Stage: ${stage}
Card-ID: ${cardId}
Created: ${new Date().toISOString().split("T")[0]}
---

# ${label}

Document content pending.
`;

  const stageDir = path.join(repoPath, "docs/business-os/cards", cardId);
  const stagePath = path.join(stageDir, `${stage}.${audience}.md`);

  await mkdirWithinRoot(repoPath, stageDir, { recursive: true });
  await writeFileWithinRoot(repoPath, stagePath, template, "utf-8");

  return stagePath;
}

export async function ensureStageDocsForLane(
  _repoPath: string,
  _cardId: string,
  _newLane: Lane
): Promise<string[]> {
  return [];
}

export async function validateStageDocsForCard(
  _repoPath: string,
  _cardId: string,
  _lane: Lane
): Promise<{
  valid: boolean;
  missingDocs: Array<{ stage: StageType; audience: "user" | "agent" }>;
}> {
  return {
    valid: true,
    missingDocs: [],
  };
}
