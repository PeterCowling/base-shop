import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { runLiveHook } from "./lp-do-ideas-live-hook.js";
import type { ArtifactDeltaEvent } from "./lp-do-ideas-trial.js";

interface RegistryArtifact {
  artifact_id: string;
  path: string;
  business: string;
  active: boolean;
}

interface RegistryDocument {
  t1_semantic_sections?: string[];
  artifacts: RegistryArtifact[];
}

interface BuildCommitHookOptions {
  rootDir: string;
  business: string;
  registryPath: string;
  queueStatePath: string;
  telemetryPath: string;
  fromRef: string;
  toRef: string;
}

interface BuildCommitHookResult {
  ok: boolean;
  event_count: number;
  matched_artifacts: string[];
  warnings: string[];
  dispatched_count: number;
  suppressed: number;
  noop: number;
  error?: string;
}

function parseArgs(argv: string[]): BuildCommitHookOptions {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(token.slice(2), value);
    i += 1;
  }

  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

  return {
    rootDir: flags.get("root-dir") ?? defaultRootDir,
    business: flags.get("business") ?? "BOS",
    registryPath:
      flags.get("registry-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "standing-registry.json"),
    queueStatePath:
      flags.get("queue-state-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    telemetryPath:
      flags.get("telemetry-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl"),
    fromRef: flags.get("from-ref") ?? "HEAD~1",
    toRef: flags.get("to-ref") ?? "HEAD",
  };
}

function git(rootDir: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readRegistry(rootDir: string, registryPath: string): RegistryDocument {
  const absolute = path.isAbsolute(registryPath)
    ? registryPath
    : path.join(rootDir, registryPath);
  const parsed = JSON.parse(readFileSync(absolute, "utf-8")) as RegistryDocument;
  return parsed;
}

function listChangedFiles(rootDir: string, fromRef: string, toRef: string): string[] {
  const output = git(rootDir, ["diff", "--name-only", `${fromRef}..${toRef}`]);
  if (output.length === 0) {
    return [];
  }
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function safeBlobSha(rootDir: string, ref: string, filePath: string): string | null {
  try {
    const blobRef = `${ref}:${filePath}`;
    return git(rootDir, ["rev-parse", blobRef]);
  } catch {
    return null;
  }
}

function deriveChangedSections(
  rootDir: string,
  fromRef: string,
  toRef: string,
  filePath: string,
  keywords: readonly string[],
): string[] {
  let diffText = "";
  try {
    diffText = git(rootDir, ["diff", "-U0", `${fromRef}..${toRef}`, "--", filePath]);
  } catch {
    return [];
  }
  const lowered = diffText.toLowerCase();
  return keywords.filter((keyword) => lowered.includes(keyword.toLowerCase()));
}

function toArtifactDeltaEvents(
  input: BuildCommitHookOptions,
  registry: RegistryDocument,
): { events: ArtifactDeltaEvent[]; matchedArtifactIds: string[] } {
  const changedFiles = new Set(listChangedFiles(input.rootDir, input.fromRef, input.toRef));
  const keywords = registry.t1_semantic_sections ?? [];

  const events: ArtifactDeltaEvent[] = [];
  const matchedArtifactIds: string[] = [];

  for (const artifact of registry.artifacts) {
    if (!artifact.active) continue;
    if (artifact.business !== input.business) continue;
    if (!changedFiles.has(artifact.path)) continue;

    const afterSha = safeBlobSha(input.rootDir, input.toRef, artifact.path);
    if (!afterSha) {
      continue;
    }

    const beforeSha = safeBlobSha(input.rootDir, input.fromRef, artifact.path);
    const changedSections = deriveChangedSections(
      input.rootDir,
      input.fromRef,
      input.toRef,
      artifact.path,
      keywords,
    );

    events.push({
      artifact_id: artifact.artifact_id,
      business: input.business,
      before_sha: beforeSha,
      after_sha: afterSha,
      path: artifact.path,
      changed_sections: changedSections,
      material_delta: changedSections.length > 0,
      updated_by_process: "lp-do-build-post-commit-hook",
      evidence_refs: [
        `git-diff:${input.fromRef}..${input.toRef}:${artifact.path}`,
        `standing-registry:${artifact.artifact_id}`,
      ],
    });
    matchedArtifactIds.push(artifact.artifact_id);
  }

  return { events, matchedArtifactIds };
}

export async function runBuildCommitIdeasHook(
  options: BuildCommitHookOptions,
): Promise<BuildCommitHookResult> {
  const registry = readRegistry(options.rootDir, options.registryPath);
  const { events, matchedArtifactIds } = toArtifactDeltaEvents(options, registry);

  if (events.length === 0) {
    return {
      ok: true,
      event_count: 0,
      matched_artifacts: [],
      warnings: ["No changed registered artifacts detected in commit range."],
      dispatched_count: 0,
      suppressed: 0,
      noop: 0,
    };
  }

  const hookResult = await runLiveHook({
    business: options.business,
    registryPath: path.isAbsolute(options.registryPath)
      ? options.registryPath
      : path.join(options.rootDir, options.registryPath),
    queueStatePath: options.queueStatePath,
    telemetryPath: options.telemetryPath,
    events,
  });

  return {
    ok: hookResult.ok,
    event_count: events.length,
    matched_artifacts: matchedArtifactIds,
    warnings: hookResult.warnings,
    dispatched_count: hookResult.dispatched.length,
    suppressed: hookResult.suppressed,
    noop: hookResult.noop,
    ...(hookResult.error ? { error: hookResult.error } : {}),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await runBuildCommitIdeasHook(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("lp-do-ideas-build-commit-hook")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify({ ok: false, error: message, event_count: 0 }, null, 2)}\n`,
    );
    process.exit(0);
  });
}
