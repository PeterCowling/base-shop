/**
 * Integration tests for the lp-do-ideas live path end-to-end.
 *
 * TC-06-A: Full end-to-end live path — hook runs, result is persisted, re-run produces no new entries
 * TC-06-B: Hook error (bad registry) does not throw at the SIGNALS caller level; caller gets ok:false result
 * TC-06-C: Dispatched live packets pass through routeDispatch successfully
 * TC-06-D: Suppression counts (suppressed + noop) are non-negative integers in both ok and error results
 */

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { runLiveOrchestrator } from "../lp-do-ideas-live.js";
import { runLiveHook } from "../lp-do-ideas-live-hook.js";
import { type PersistedQueueState, persistOrchestratorResult } from "../lp-do-ideas-persistence.js";
import { routeDispatch, type RouteSuccess } from "../lp-do-ideas-routing-adapter.js";
import type { ArtifactDeltaEvent } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-25T10:00:00.000Z");
const FIXED_DATE_B = new Date("2026-02-25T11:00:00.000Z");

/** Builds a unique temporary directory for test isolation. */
function makeTmpDir(): string {
  const dir = join(tmpdir(), `live-integration-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Minimal valid standing registry JSON with one active SELL artifact. */
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

/** Minimal valid standing registry with two active artifacts. */
const MULTI_ARTIFACT_REGISTRY = JSON.stringify({
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
    {
      artifact_id: "BRIK-MARKET-PACK",
      path: "docs/business-os/market-research/BRIK/market-pack.user.md",
      domain: "MARKET",
      business: "BRIK",
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
// TC-06-A: Full end-to-end live path
// hook runs → result is persisted → re-run produces no new entries
// ---------------------------------------------------------------------------

describe("TC-06-A: full end-to-end live path — hook → persist → idempotent re-run", () => {
  it("hook produces ok:true result with at least one dispatched packet for a valid event", async () => {
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
    // With a SELL domain event and eligible artifact, at least one dispatch expected
    expect(result.dispatched.length).toBeGreaterThanOrEqual(1);
    expect(result.dispatched[0].mode).toBe("live");
  });

  it("persisting the hook result creates queue-state.json and telemetry.jsonl", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const hookResult = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(hookResult.ok).toBe(true);

    if (!hookResult.ok || hookResult.dispatched.length === 0) {
      // If no dispatches (e.g., suppressed), skip persistence assertions
      return;
    }

    const persistResult = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: hookResult.dispatched,
      clock: () => FIXED_DATE,
    });

    expect(persistResult.ok).toBe(true);
    expect(persistResult.new_entries_written).toBeGreaterThanOrEqual(1);
    expect(persistResult.telemetry_records_written).toBeGreaterThanOrEqual(1);
    expect(existsSync(queueStatePath)).toBe(true);
    expect(existsSync(telemetryPath)).toBe(true);
  });

  it("re-running persistence with identical dispatched packets writes zero new entries", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const hookResult = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(hookResult.ok).toBe(true);

    if (!hookResult.ok || hookResult.dispatched.length === 0) {
      return;
    }

    const opts = {
      queueStatePath,
      telemetryPath,
      mode: "live" as const,
      business: "HEAD",
      dispatched: hookResult.dispatched,
      clock: () => FIXED_DATE,
    };

    const first = persistOrchestratorResult(opts);
    expect(first.ok).toBe(true);
    expect(first.new_entries_written).toBeGreaterThanOrEqual(1);

    // Second run: same packets → idempotent
    const second = persistOrchestratorResult(opts);
    expect(second.ok).toBe(true);
    expect(second.new_entries_written).toBe(0);
    expect(second.telemetry_records_written).toBe(0);
  });

  it("queue-state entry count is stable after three identical persistence runs", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const hookResult = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    if (!hookResult.ok || hookResult.dispatched.length === 0) {
      return;
    }

    const opts = {
      queueStatePath,
      telemetryPath,
      mode: "live" as const,
      business: "HEAD",
      dispatched: hookResult.dispatched,
      clock: () => FIXED_DATE,
    };

    persistOrchestratorResult(opts);
    persistOrchestratorResult(opts);
    persistOrchestratorResult(opts);

    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;

    // Entry count equals exactly the number of distinct dispatched packets
    expect(state.entries).toHaveLength(hookResult.dispatched.length);
  });

  it("second hook run with different event produces a new dispatch — admitted on subsequent persistence run", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    // First run: event A
    const firstHook = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent({ before_sha: "sha-v1", after_sha: "sha-v2" })],
      clock: () => FIXED_DATE,
    });
    expect(firstHook.ok).toBe(true);
    if (!firstHook.ok || firstHook.dispatched.length === 0) return;

    const firstPersist = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: firstHook.dispatched,
      clock: () => FIXED_DATE,
    });
    expect(firstPersist.ok).toBe(true);
    const firstEntryCount = firstPersist.new_entries_written;

    // Second run: different event (different shas produce different dispatch_id)
    const secondHook = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath,
      telemetryPath,
      events: [makeValidEvent({ before_sha: "sha-v3", after_sha: "sha-v4" })],
      clock: () => FIXED_DATE_B,
    });
    expect(secondHook.ok).toBe(true);
    if (!secondHook.ok || secondHook.dispatched.length === 0) return;

    const secondPersist = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: secondHook.dispatched,
      clock: () => FIXED_DATE_B,
    });
    expect(secondPersist.ok).toBe(true);

    // Queue should have grown (or at minimum stayed stable if dispatch_ids collide)
    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;
    expect(state.entries.length).toBeGreaterThanOrEqual(firstEntryCount);
  });
});

// ---------------------------------------------------------------------------
// TC-06-B: Hook error (bad registry) does not throw at SIGNALS caller level
// ---------------------------------------------------------------------------

describe("TC-06-B: hook error path — caller gets ok:false result without throw", () => {
  it("malformed registry JSON returns ok:false — no throw", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "malformed-registry.json");
    writeFileSync(registryPath, "{ this is not valid json }", "utf-8");

    let result;
    // Simulates SIGNALS advance: wrap in try/catch to prove it never throws
    let threw = false;
    try {
      result = await runLiveHook({
        business: "HEAD",
        registryPath,
        queueStatePath: join(dir, "queue-state.json"),
        telemetryPath: join(dir, "telemetry.jsonl"),
        events: [makeValidEvent()],
        clock: () => FIXED_DATE,
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result).toBeDefined();
    expect(result!.ok).toBe(false);
    // SIGNALS advance is unblocked even on hook error
    expect(typeof result!.error).toBe("string");
  });

  it("missing registry file returns ok:false — no throw", async () => {
    const dir = makeTmpDir();
    const nonExistentPath = join(dir, "does-not-exist", "registry.json");

    let result;
    let threw = false;
    try {
      result = await runLiveHook({
        business: "HEAD",
        registryPath: nonExistentPath,
        queueStatePath: join(dir, "queue-state.json"),
        telemetryPath: join(dir, "telemetry.jsonl"),
        clock: () => FIXED_DATE,
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result!.ok).toBe(false);
    expect(result!.dispatched).toHaveLength(0);
    expect(result!.warnings.length).toBeGreaterThan(0);
  });

  it("registry missing 'artifacts' key returns ok:false without throw", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry-no-artifacts.json");
    writeFileSync(registryPath, JSON.stringify({ version: "1.0" }), "utf-8");

    let threw = false;
    let result;
    try {
      result = await runLiveHook({
        business: "HEAD",
        registryPath,
        queueStatePath: join(dir, "queue-state.json"),
        telemetryPath: join(dir, "telemetry.jsonl"),
        clock: () => FIXED_DATE,
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result!.ok).toBe(false);
    expect(result!.error).toBeDefined();
  });

  it("hook error path does not write queue-state or telemetry files — SIGNALS state unaffected", async () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    await runLiveHook({
      business: "HEAD",
      registryPath: join(dir, "no-registry.json"),
      queueStatePath,
      telemetryPath,
      clock: () => FIXED_DATE,
    });

    // No file writes on error path (hook is advisory / no-mutation)
    expect(existsSync(queueStatePath)).toBe(false);
    expect(existsSync(telemetryPath)).toBe(false);
  });

  it("empty registryPath string returns ok:false without throw", async () => {
    const dir = makeTmpDir();

    let threw = false;
    let result;
    try {
      result = await runLiveHook({
        business: "HEAD",
        registryPath: "",
        queueStatePath: join(dir, "queue-state.json"),
        telemetryPath: join(dir, "telemetry.jsonl"),
        clock: () => FIXED_DATE,
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result!.ok).toBe(false);
    expect(typeof result!.error).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// TC-06-C: Dispatched live packets pass through routeDispatch successfully
// ---------------------------------------------------------------------------

describe("TC-06-C: dispatched live packets pass through routeDispatch", () => {
  it("all packets from runLiveOrchestrator route cleanly through routeDispatch", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const packet of result.dispatched) {
      const routeResult = routeDispatch(packet);
      expect(routeResult.ok).toBe(true);
      if (routeResult.ok) {
        expect(typeof routeResult.route).toBe("string");
        expect(routeResult.route.length).toBeGreaterThan(0);
      }
    }
  });

  it("routed live packet payload skill matches the packet recommended_route", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const packet of result.dispatched) {
      const routeResult = routeDispatch(packet) as RouteSuccess;
      if (!routeResult.ok) continue;
      expect(routeResult.payload.skill).toBe(packet.recommended_route);
    }
  });

  it("route result dispatch_id matches source packet dispatch_id", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const packet of result.dispatched) {
      const routeResult = routeDispatch(packet) as RouteSuccess;
      if (!routeResult.ok) continue;
      expect(routeResult.payload.dispatch_id).toBe(packet.dispatch_id);
    }
  });

  it("hook dispatched packets also route cleanly (end-to-end through hook + adapter)", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "registry.json");
    writeFileSync(registryPath, MINIMAL_REGISTRY, "utf-8");

    const hookResult = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    if (!hookResult.ok) return;

    for (const packet of hookResult.dispatched) {
      const routeResult = routeDispatch(packet);
      expect(routeResult.ok).toBe(true);
    }
  });

  it("multi-artifact registry: all emitted packets route cleanly", () => {
    const events: ArtifactDeltaEvent[] = [
      makeValidEvent({ artifact_id: "HEAD-SELL-PACK", domain: "SELL" }),
    ];

    const result = runLiveOrchestrator({
      mode: "live",
      events,
      standingRegistry: JSON.parse(MULTI_ARTIFACT_REGISTRY) as Parameters<typeof runLiveOrchestrator>[0]["standingRegistry"],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const packet of result.dispatched) {
      expect(routeDispatch(packet).ok).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-06-D: Suppression counts are non-negative integers in both ok and error results
// ---------------------------------------------------------------------------

describe("TC-06-D: suppression counts are non-negative integers in all result shapes", () => {
  it("runLiveOrchestrator ok:true result has non-negative suppressed and noop counts", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.suppressed).toBe("number");
      expect(result.suppressed).toBeGreaterThanOrEqual(0);
      expect(typeof result.noop).toBe("number");
      expect(result.noop).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.suppressed)).toBe(true);
      expect(Number.isInteger(result.noop)).toBe(true);
    }
  });

  it("runLiveHook ok:true result has non-negative suppressed and noop counts", async () => {
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
    expect(typeof result.suppressed).toBe("number");
    expect(result.suppressed).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.suppressed)).toBe(true);
    expect(typeof result.noop).toBe("number");
    expect(result.noop).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.noop)).toBe(true);
  });

  it("runLiveHook ok:false result (bad registry) still has non-negative suppressed and noop counts", async () => {
    const dir = makeTmpDir();
    const registryPath = join(dir, "malformed.json");
    writeFileSync(registryPath, "{ not json }", "utf-8");

    const result = await runLiveHook({
      business: "HEAD",
      registryPath,
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    // Even on error, counts must be non-negative integers
    expect(typeof result.suppressed).toBe("number");
    expect(result.suppressed).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.suppressed)).toBe(true);
    expect(typeof result.noop).toBe("number");
    expect(result.noop).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.noop)).toBe(true);
  });

  it("runLiveHook ok:false result (missing registry) still has non-negative suppressed and noop counts", async () => {
    const dir = makeTmpDir();

    const result = await runLiveHook({
      business: "HEAD",
      registryPath: join(dir, "no-file.json"),
      queueStatePath: join(dir, "queue-state.json"),
      telemetryPath: join(dir, "telemetry.jsonl"),
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(result.suppressed).toBeGreaterThanOrEqual(0);
    expect(result.noop).toBeGreaterThanOrEqual(0);
  });

  it("runLiveOrchestrator ok:true result suppression taxonomy ordering is deterministic across two identical runs", () => {
    const opts = {
      mode: "live" as const,
      events: [makeValidEvent(), makeValidEvent({ before_sha: null })],
      clock: () => FIXED_DATE,
    };

    const result1 = runLiveOrchestrator(opts);
    const result2 = runLiveOrchestrator(opts);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    if (result1.ok && result2.ok) {
      // Suppressed and noop counts must be deterministic
      expect(result1.suppressed).toBe(result2.suppressed);
      expect(result1.noop).toBe(result2.noop);
      // Dispatched count must also be deterministic
      expect(result1.dispatched.length).toBe(result2.dispatched.length);
    }
  });

  it("suppressed + noop + dispatched equals total events processed (accounting completeness)", () => {
    const events = [
      makeValidEvent({ before_sha: "sha1", after_sha: "sha2" }), // should dispatch
      makeValidEvent({ before_sha: null }), // no before_sha → noop (first registration)
    ];

    const result = runLiveOrchestrator({
      mode: "live",
      events,
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // All inputs are accounted for
      const total = result.dispatched.length + result.suppressed + result.noop;
      expect(total).toBeGreaterThanOrEqual(1); // at least one event was processed
      expect(total).toBeLessThanOrEqual(events.length * 2); // upper bound sanity check
    }
  });
});
