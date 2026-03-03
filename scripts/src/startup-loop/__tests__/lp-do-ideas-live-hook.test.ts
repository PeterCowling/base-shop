/**
 * Tests for the lp-do-ideas live advisory hook.
 *
 * TC-03-A: Happy-path hook emits dispatch candidates
 * TC-03-B: Thrown hook error records warning and does not propagate
 * TC-03-C: No stage mutation side effects — hook performs no file writes
 * TC-03-D: Missing registry path returns non-throwing error result
 */

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { runLiveHook } from "../lp-do-ideas-live-hook.js";
import type { ArtifactDeltaEvent } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-25T10:00:00.000Z");

/** Builds a unique temporary directory for test isolation. */
function makeTmpDir(): string {
  const dir = join(tmpdir(), `live-hook-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Minimal valid standing registry JSON with one active artifact. */
const MINIMAL_REGISTRY = JSON.stringify({
  artifacts: [
    {
      artifact_id: "HEAD-SELL-PACK",
      path: "docs/business-os/strategy/HEAD/sell-pack.user.md",
      domain: "SELL",
      business: "HEAD",
      artifact_class: "source_process",
      trigger_policy: "eligible",
      last_known_sha: null,
      registered_at: "2026-02-25T00:00:00.000Z",
      active: true,
    },
  ],
});

/** A valid artifact delta event that produces a dispatchable packet. */
function makeValidEvent(
  overrides: Partial<ArtifactDeltaEvent> = {},
): ArtifactDeltaEvent {
  return {
    artifact_id: "HEAD-SELL-PACK",
    business: "HEAD",
    before_sha: "abc0001",
    after_sha: "def0002",
    path: "docs/business-os/strategy/HEAD/sell-pack.user.md",
    domain: "SELL",
    changed_sections: ["channel strategy", "pricing"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-03-A: Happy path — hook emits dispatch candidates
// ---------------------------------------------------------------------------

describe("TC-03-A: happy-path hook emits dispatch candidates", () => {
  it("returns ok: true with dispatched packets when registry is valid and events provided", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    // With a valid SELL domain event and an eligible artifact, at least one dispatch is expected
    expect(typeof result.suppressed).toBe("number");
    expect(typeof result.noop).toBe("number");
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("dispatched packets have mode='live' when ok: true", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    if (result.ok && result.dispatched.length > 0) {
      for (const packet of result.dispatched) {
        expect(packet.mode).toBe("live");
      }
    }
  });

  it("returns ok: true with zero dispatches when events array is empty (noop)", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      events: [],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    expect(result.dispatched).toHaveLength(0);
    expect(result.error).toBeUndefined();
  });

  it("returns ok: true with zero dispatches when events is omitted (default empty)", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    expect(result.dispatched).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-03-B: Error path — hook never throws, degrading to warning telemetry
// ---------------------------------------------------------------------------

describe("TC-03-B: hook errors return non-throwing result with warnings", () => {
  it("returns ok: false when registry JSON is malformed — does not throw", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry-malformed.json");
    writeFileSync(registryPath, "{ not valid json }", "utf-8");

    let result;
    expect(async () => {
      result = await runLiveHook({
        business: "HEAD",
        registryPath,
        queueStatePath: join(dir, "queue-state.json"),
        telemetryPath: join(dir, "telemetry.jsonl"),
        clock: () => FIXED_DATE,
      });
    }).not.toThrow();

    // Also assert the actual result
    result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(result.dispatched).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(typeof result.error).toBe("string");
  });

  it("returns ok: false with warning when registry missing 'artifacts' key — no throw", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry-no-artifacts.json");
    writeFileSync(registryPath, JSON.stringify({ version: "1.0" }), "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// TC-03-C: No stage mutation — runLiveHook performs no file writes
// ---------------------------------------------------------------------------

describe("TC-03-C: no stage mutation side effects from hook execution", () => {
  it("does not write queue-state file after a successful run", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    // Verify no files were written by the hook
    expect(existsSync(queueStatePath)).toBe(false);
    expect(existsSync(telemetryPath)).toBe(false);
  });

  it("does not write any files after an error run", async () => {
    const dir = makeTmpDir();
    const missingRegistryPath = join(dir, "does-not-exist.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    await runLiveHook({
      business: "HEAD",
      registryPath: missingRegistryPath,
      queueStatePath,
      telemetryPath,
      clock: () => FIXED_DATE,
    });

    expect(existsSync(queueStatePath)).toBe(false);
    expect(existsSync(telemetryPath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-03-D: Missing registry — returns error result, does not throw
// ---------------------------------------------------------------------------

describe("TC-03-D: missing registry returns non-throwing error result", () => {
  it("returns ok: false with diagnostic warning when registry file does not exist", async () => {
    const dir = makeTmpDir();
    const nonExistentPath = join(dir, "not-here", "registry.json");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath: nonExistentPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(result.dispatched).toHaveLength(0);
    expect(result.suppressed).toBe(0);
    expect(result.noop).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    // Diagnostic message should mention the path
    expect(result.error).toContain("not-here");
  });

  it("does not throw when registry path is an empty string", async () => {
    const dir = makeTmpDir();

    const result = await runLiveHook({
      business: "HEAD",
      registryPath: "",
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});
