import type { ActuatorAdapter } from "./self-evolving-actuator.js";
import { executeContainer } from "./self-evolving-containers.js";
import type { ContainerContract, StartupState } from "./self-evolving-contracts.js";

export interface ReplayFixture {
  fixture_id: string;
  container_name: string;
  startup_state: StartupState;
  input_deltas: Record<string, unknown>;
  expected_output_keys: string[];
}

export interface ReplayResult {
  fixture_id: string;
  passed: boolean;
  missing_output_keys: string[];
  blocked_reason: string | null;
}

export function runReplayFixture(
  fixture: ReplayFixture,
  contract: ContainerContract,
  actuators: Record<string, ActuatorAdapter>,
): ReplayResult {
  const execution = executeContainer({
    startup_state: fixture.startup_state,
    contract,
    input_deltas: fixture.input_deltas,
    actuators,
    approval_level: 2,
    dry_run: true,
  });

  const missingOutputKeys = fixture.expected_output_keys.filter(
    (key) => !(key in execution.outputs),
  );

  return {
    fixture_id: fixture.fixture_id,
    passed: execution.ok && missingOutputKeys.length === 0,
    missing_output_keys: missingOutputKeys,
    blocked_reason: execution.blocked_reason,
  };
}

export function summarizeReplay(results: ReplayResult[]): {
  total: number;
  passed: number;
  failed: number;
} {
  const passed = results.filter((result) => result.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
  };
}
