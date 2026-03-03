import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { getFrontmatterString, parseFrontmatter } from "./markdown.js";

export type WorldclassState = 1 | 2 | 3 | 4;

export interface WorldclassStateInput {
  goalPath: string;
  benchmarkPath: string;
}

export interface WorldclassStateResult {
  state: WorldclassState;
  reason: string;
  goalVersion: string | null;
  benchmarkGoalVersion: string | null;
}

export interface GoalContractInput {
  singularGoal: string;
  domainIds: string[];
  constraints: string[];
}

export function classifyWorldclassState(
  input: WorldclassStateInput,
): WorldclassStateResult {
  if (!existsSync(input.goalPath)) {
    return {
      state: 1,
      reason: "Goal artifact is missing.",
      goalVersion: null,
      benchmarkGoalVersion: null,
    };
  }
  if (!existsSync(input.benchmarkPath)) {
    const goalVersion = readGoalVersion(input.goalPath);
    return {
      state: 2,
      reason: "Benchmark artifact is missing.",
      goalVersion,
      benchmarkGoalVersion: null,
    };
  }

  const goalVersion = readGoalVersion(input.goalPath);
  const benchmarkGoalVersion = readGoalVersion(input.benchmarkPath);
  if (goalVersion && benchmarkGoalVersion && goalVersion === benchmarkGoalVersion) {
    return {
      state: 3,
      reason: "Goal and benchmark versions are aligned.",
      goalVersion,
      benchmarkGoalVersion,
    };
  }

  return {
    state: 4,
    reason: "Goal and benchmark versions are mismatched.",
    goalVersion,
    benchmarkGoalVersion,
  };
}

export function computeGoalContractHash(input: GoalContractInput): string {
  const normalizedGoal = normalizeWhitespace(input.singularGoal);
  const domains = [...input.domainIds].map(normalizeWhitespace).sort();
  const constraints = [...input.constraints].map(normalizeWhitespace).sort();
  const contractString = `${normalizedGoal}\n${domains.join("|")}\n${constraints.join("|")}`;
  return createHash("sha256").update(contractString).digest("hex");
}

function readGoalVersion(markdownPath: string): string | null {
  const parsed = parseFrontmatter(readFileSync(markdownPath, "utf8"));
  return (
    getFrontmatterString(parsed.frontmatter, "goal_version") ??
    getFrontmatterString(parsed.frontmatter, "goal-version")
  );
}

function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}
