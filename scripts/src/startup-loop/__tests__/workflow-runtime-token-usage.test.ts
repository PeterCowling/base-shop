import { randomBytes } from "node:crypto";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  findClaudeSessionFromDebugLatest,
  findClaudeSessionFromIndex,
  parseSessionJsonlUsage,
  resolveWorkflowRuntimeTokenUsage,
  validateClaudePath,
} from "../ideas/workflow-runtime-token-usage.js";

function makeTmpDir(): string {
  const dir = join(tmpdir(), `token-usage-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(base: string, relativePath: string, content: string): string {
  const fullPath = join(base, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
  return fullPath;
}

function makeSessionJsonl(messages: Array<{ input: number; output: number; cacheCreate?: number; cacheRead?: number }>): string {
  const lines: string[] = [];
  // Add a user message first (should be skipped by parser)
  lines.push(JSON.stringify({ type: "user", message: { role: "user", content: "hello" } }));
  for (const msg of messages) {
    lines.push(
      JSON.stringify({
        type: "assistant",
        message: {
          usage: {
            input_tokens: msg.input,
            output_tokens: msg.output,
            cache_creation_input_tokens: msg.cacheCreate ?? 0,
            cache_read_input_tokens: msg.cacheRead ?? 0,
            service_tier: "standard",
          },
          model: "claude-opus-4-6",
        },
      }),
    );
  }
  return lines.join("\n") + "\n";
}

describe("parseSessionJsonlUsage", () => {
  it("sums per-message usage from assistant messages (TC-01)", () => {
    const tmp = makeTmpDir();
    const jsonlPath = writeFile(
      tmp,
      "session.jsonl",
      makeSessionJsonl([
        { input: 10, output: 5, cacheCreate: 100, cacheRead: 50 },
        { input: 20, output: 10, cacheCreate: 200, cacheRead: 0 },
        { input: 30, output: 15 },
      ]),
    );

    const result = parseSessionJsonlUsage(jsonlPath, "test-session");
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("claude");
    expect(result!.sessionId).toBe("test-session");
    // Total input: (10+100+50) + (20+200+0) + (30+0+0) = 410
    expect(result!.totalInputTokens).toBe(410);
    // Total output: 5 + 10 + 15 = 30
    expect(result!.totalOutputTokens).toBe(30);
    // Last message: input = 30+0+0 = 30, output = 15
    expect(result!.lastInputTokens).toBe(30);
    expect(result!.lastOutputTokens).toBe(15);
  });

  it("returns null for no assistant messages (TC-02)", () => {
    const tmp = makeTmpDir();
    const jsonlPath = writeFile(
      tmp,
      "session.jsonl",
      JSON.stringify({ type: "user", message: { role: "user" } }) + "\n",
    );

    const result = parseSessionJsonlUsage(jsonlPath, "test-session");
    expect(result).toBeNull();
  });

  it("skips malformed lines and returns partial sum (TC-03)", () => {
    const tmp = makeTmpDir();
    const content = [
      JSON.stringify({ type: "assistant", message: { usage: { input_tokens: 10, output_tokens: 5 } } }),
      "NOT_VALID_JSON",
      JSON.stringify({ type: "assistant", message: { usage: { input_tokens: 20, output_tokens: 10 } } }),
    ].join("\n") + "\n";
    const jsonlPath = writeFile(tmp, "session.jsonl", content);

    const result = parseSessionJsonlUsage(jsonlPath, "test-session");
    expect(result).not.toBeNull();
    expect(result!.totalInputTokens).toBe(30);
    expect(result!.totalOutputTokens).toBe(15);
  });

  it("returns null for missing file", () => {
    const result = parseSessionJsonlUsage("/nonexistent/path.jsonl", "test-session");
    expect(result).toBeNull();
  });
});

describe("findClaudeSessionFromIndex", () => {
  it("returns latest session by mtime (TC-04)", () => {
    const tmp = makeTmpDir();
    // Simulate CWD = /Users/test/project → encoded = -Users-test-project
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    const projectDir = join(tmp, "projects", encodedCwd);

    // Write sessions-index.json
    const index = {
      version: 1,
      entries: [
        { sessionId: "old-session", fullPath: join(projectDir, "old-session.jsonl"), fileMtime: 1000 },
        { sessionId: "latest-session", fullPath: join(projectDir, "latest-session.jsonl"), fileMtime: 3000 },
        { sessionId: "mid-session", fullPath: join(projectDir, "mid-session.jsonl"), fileMtime: 2000 },
      ],
    };
    writeFile(tmp, `projects/${encodedCwd}/sessions-index.json`, JSON.stringify(index));
    // Create the session JSONL so the directory exists
    writeFile(tmp, `projects/${encodedCwd}/latest-session.jsonl`, "");

    const result = findClaudeSessionFromIndex(join(tmp, "projects"), cwd);
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe("latest-session");
    expect(result!.sessionJsonlPath).toContain("latest-session.jsonl");
  });

  it("returns null for missing index (TC-05)", () => {
    const result = findClaudeSessionFromIndex("/nonexistent", "/some/cwd");
    expect(result).toBeNull();
  });

  it("returns null for malformed index (TC-05)", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    writeFile(tmp, `projects/${encodedCwd}/sessions-index.json`, "NOT_JSON");

    const result = findClaudeSessionFromIndex(join(tmp, "projects"), cwd);
    expect(result).toBeNull();
  });

  it("returns null for empty entries array", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    writeFile(tmp, `projects/${encodedCwd}/sessions-index.json`, JSON.stringify({ version: 1, entries: [] }));

    const result = findClaudeSessionFromIndex(join(tmp, "projects"), cwd);
    expect(result).toBeNull();
  });
});

describe("findClaudeSessionFromDebugLatest", () => {
  it("resolves symlink and extracts UUID (TC-06)", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    const sessionId = "69d199f6-bf3f-4837-a680-8fa673ae6207";

    // Create debug dir with symlink
    const debugDir = join(tmp, "debug");
    mkdirSync(debugDir, { recursive: true });
    const debugFile = join(debugDir, `${sessionId}.txt`);
    writeFileSync(debugFile, "debug content");
    symlinkSync(debugFile, join(debugDir, "latest"));

    // Create the session JSONL in the projects dir
    writeFile(tmp, `projects/${encodedCwd}/${sessionId}.jsonl`, makeSessionJsonl([{ input: 5, output: 3 }]));

    const result = findClaudeSessionFromDebugLatest(debugDir, join(tmp, "projects"), cwd);
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe(sessionId);
    expect(result!.sessionJsonlPath).toContain(`${sessionId}.jsonl`);
  });

  it("returns null when symlink missing (TC-07)", () => {
    const tmp = makeTmpDir();
    const result = findClaudeSessionFromDebugLatest(join(tmp, "debug"), join(tmp, "projects"), "/some/cwd");
    expect(result).toBeNull();
  });

  it("returns null when session JSONL does not exist for this project", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const sessionId = "69d199f6-bf3f-4837-a680-8fa673ae6207";

    const debugDir = join(tmp, "debug");
    mkdirSync(debugDir, { recursive: true });
    const debugFile = join(debugDir, `${sessionId}.txt`);
    writeFileSync(debugFile, "debug content");
    symlinkSync(debugFile, join(debugDir, "latest"));

    // Don't create the session JSONL — should return null
    const result = findClaudeSessionFromDebugLatest(debugDir, join(tmp, "projects"), cwd);
    expect(result).toBeNull();
  });
});

describe("validateClaudePath", () => {
  it("accepts paths within ~/.claude/", () => {
    const homedir = require("node:os").homedir();
    const claudePath = join(homedir, ".claude", "projects", "test");
    // Only test if the directory actually exists
    const { existsSync } = require("node:fs");
    if (existsSync(join(homedir, ".claude"))) {
      expect(validateClaudePath(claudePath)).toBe(true);
    }
  });
});

describe("resolveWorkflowRuntimeTokenUsage cascade", () => {
  it("explicit session ID wins over auto-discovery (TC-01)", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    const explicitSessionId = "explicit-123";
    const indexSessionId = "index-456";

    // Write Claude telemetry log for explicit session
    const telemetryDir = join(tmp, "telemetry");
    writeFile(
      tmp,
      `telemetry/1p_failed_events.${explicitSessionId}.json`,
      JSON.stringify({
        event_data: {
          event_name: "tengu_api_success",
          client_timestamp: "2026-03-11T10:00:00.000Z",
          session_id: explicitSessionId,
          additional_metadata: JSON.stringify({
            inputTokens: 100,
            outputTokens: 50,
          }),
        },
      }) + "\n",
    );

    // Write sessions-index pointing to a different session
    const index = {
      version: 1,
      entries: [{ sessionId: indexSessionId, fullPath: join(tmp, `projects/${encodedCwd}/${indexSessionId}.jsonl`), fileMtime: 5000 }],
    };
    writeFile(tmp, `projects/${encodedCwd}/sessions-index.json`, JSON.stringify(index));
    writeFile(tmp, `projects/${encodedCwd}/${indexSessionId}.jsonl`, makeSessionJsonl([{ input: 999, output: 999 }]));

    const result = resolveWorkflowRuntimeTokenUsage({
      existingRecords: [],
      featureSlug: "test",
      env: {
        CLAUDE_SESSION_ID: explicitSessionId,
      } as unknown as NodeJS.ProcessEnv,
      claudeTelemetryRoot: telemetryDir,
      claudeProjectsRoot: join(tmp, "projects"),
      claudeDebugDir: join(tmp, "debug"),
      cwd,
    });

    // Explicit session wins — should use telemetry data, not index data
    expect(result.runtimeUsageProvider).toBe("claude");
    expect(result.runtimeSessionId).toBe(explicitSessionId);
    expect(result.note).toContain("explicit_session_id");
  });

  it("sessions-index auto-discovery when no explicit ID (TC-02)", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    const sessionId = "auto-discovered-session";

    const index = {
      version: 1,
      entries: [{ sessionId, fullPath: join(tmp, `projects/${encodedCwd}/${sessionId}.jsonl`), fileMtime: 5000 }],
    };
    writeFile(tmp, `projects/${encodedCwd}/sessions-index.json`, JSON.stringify(index));
    writeFile(
      tmp,
      `projects/${encodedCwd}/${sessionId}.jsonl`,
      makeSessionJsonl([{ input: 50, output: 25 }]),
    );

    const result = resolveWorkflowRuntimeTokenUsage({
      existingRecords: [],
      featureSlug: "test",
      env: {} as NodeJS.ProcessEnv,
      claudeTelemetryRoot: join(tmp, "telemetry"),
      claudeProjectsRoot: join(tmp, "projects"),
      claudeDebugDir: join(tmp, "debug"),
      cwd,
    });

    expect(result.runtimeUsageProvider).toBe("claude");
    expect(result.runtimeSessionId).toBe(sessionId);
    expect(result.tokenSource).toBe("api_usage");
    expect(result.note).toContain("sessions_index");
  });

  it("debug/latest fallback when index unavailable (TC-03)", () => {
    const tmp = makeTmpDir();
    const cwd = join(tmp, "project");
    const encodedCwd = cwd.replaceAll("/", "-");
    const sessionId = "69d199f6-bf3f-4837-a680-8fa673ae6207";

    // No sessions-index — should fall through to debug/latest
    const debugDir = join(tmp, "debug");
    mkdirSync(debugDir, { recursive: true });
    const debugFile = join(debugDir, `${sessionId}.txt`);
    writeFileSync(debugFile, "debug");
    symlinkSync(debugFile, join(debugDir, "latest"));

    writeFile(
      tmp,
      `projects/${encodedCwd}/${sessionId}.jsonl`,
      makeSessionJsonl([{ input: 30, output: 15 }]),
    );

    const result = resolveWorkflowRuntimeTokenUsage({
      existingRecords: [],
      featureSlug: "test",
      env: {} as NodeJS.ProcessEnv,
      claudeTelemetryRoot: join(tmp, "telemetry"),
      claudeProjectsRoot: join(tmp, "projects"),
      claudeDebugDir: debugDir,
      cwd,
    });

    expect(result.runtimeUsageProvider).toBe("claude");
    expect(result.runtimeSessionId).toBe(sessionId);
    expect(result.note).toContain("debug_latest");
  });

  it("returns unknown when all discovery fails (TC-04)", () => {
    const tmp = makeTmpDir();

    const result = resolveWorkflowRuntimeTokenUsage({
      existingRecords: [],
      featureSlug: "test",
      env: {} as NodeJS.ProcessEnv,
      claudeTelemetryRoot: join(tmp, "telemetry"),
      claudeProjectsRoot: join(tmp, "projects"),
      claudeDebugDir: join(tmp, "debug"),
      cwd: join(tmp, "project"),
    });

    expect(result.tokenSource).toBe("unknown");
    expect(result.runtimeUsageProvider).toBeNull();
    expect(result.note).toBeNull();
  });
});
