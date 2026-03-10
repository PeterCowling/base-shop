import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { runAgentSessionSignalsBridge } from "../ideas/lp-do-ideas-agent-session-bridge.js";

async function writeJson(root: string, relativePath: string, value: unknown): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeTranscript(
  root: string,
  relativePath: string,
  lines: Array<Record<string, unknown>>,
): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, "utf8");
}

describe("lp-do-ideas agent session bridge", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ideas-agent-session-"));

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/standing-registry.json",
      {
        registry_version: "registry.v2",
        trigger_threshold: "T1-conservative",
        t1_semantic_sections: [
          "walkthrough finding",
          "testing issue",
          "ux gap",
          "broken flow",
        ],
        unknown_artifact_policy: "fail_closed_never_trigger",
        artifacts: [
          {
            artifact_id: "BOS-BOS-AGENT_SESSION_FINDINGS",
            path: "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
        ],
      },
    );

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [],
        counts: {},
        last_updated: "2026-01-01T00:00:00.000Z",
      },
    );

    await writeTranscript(
      repoRoot,
      "tmp/transcripts/session-a.jsonl",
      [
        {
          type: "user",
          sessionId: "session-a",
          timestamp: "2026-03-03T20:10:00.000Z",
          message: {
            role: "user",
            content: [
              {
                type: "text",
                text: "Walk through the upload flow, simulate file submission, and list issues.",
              },
            ],
          },
        },
        {
          type: "assistant",
          sessionId: "session-a",
          timestamp: "2026-03-03T20:11:00.000Z",
          message: {
            role: "assistant",
            content: [
              {
                type: "text",
                text: [
                  "Findings:",
                  "- Upload button fails silently when the API times out.",
                  "- Mobile layout has a usability issue: footer overlaps submit CTA.",
                ].join("\n"),
              },
            ],
          },
        },
      ],
    );
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("extracts findings from transcripts and enqueues dispatches", async () => {
    const result = runAgentSessionSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/agent-session-signal-bridge-state.json",
      artifactPath: "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
      transcriptsRoot: path.join(repoRoot, "tmp/transcripts"),
      sessionLimit: 10,
    });

    expect(result.ok).toBe(true);
    expect(result.sessions_scanned).toBe(1);
    expect(result.sessions_with_findings).toBe(1);
    expect(result.dispatches_enqueued).toBeGreaterThan(0);

    const artifactRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json"),
      "utf8",
    );
    const artifact = JSON.parse(artifactRaw) as { findings: Array<{ findings: string[] }> };
    expect(artifact.findings).toHaveLength(1);
    expect(artifact.findings[0]?.findings.length).toBeGreaterThan(0);

    const queueStateRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
      "utf8",
    );
    const queueState = JSON.parse(queueStateRaw) as { dispatches: Array<{ artifact_id: string }> };
    expect(queueState.dispatches.length).toBeGreaterThan(0);
    expect(queueState.dispatches[0]?.artifact_id).toBe("BOS-BOS-AGENT_SESSION_FINDINGS");
  });

  it("suppresses repeat emissions when findings hash is unchanged", () => {
    const first = runAgentSessionSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/agent-session-signal-bridge-state.json",
      artifactPath: "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
      transcriptsRoot: path.join(repoRoot, "tmp/transcripts"),
      sessionLimit: 10,
    });
    expect(first.ok).toBe(true);
    expect(first.dispatches_enqueued).toBeGreaterThan(0);

    const second = runAgentSessionSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/agent-session-signal-bridge-state.json",
      artifactPath: "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
      transcriptsRoot: path.join(repoRoot, "tmp/transcripts"),
      sessionLimit: 10,
    });
    expect(second.ok).toBe(true);
    expect(second.dispatches_enqueued).toBe(0);
  });
});
