import type { EffectClass, EffectReversibility } from "./self-evolving-contracts.js";

export interface ActuatorRequest {
  action: string;
  dry_run: boolean;
  payload: Record<string, unknown>;
  approval_level: 1 | 2 | 3 | 4;
}

export interface ActuatorResult {
  ok: boolean;
  dry_run: boolean;
  effect_applied: boolean;
  rollback_available: boolean;
  message: string;
  output: Record<string, unknown>;
}

export interface ActuatorAdapter {
  actuator_name: string;
  actuator_version: string;
  effect_class: EffectClass;
  effect_reversibility: EffectReversibility;
  requires_credentials: string[];
  supports_dry_run: boolean;
  supports_rollback: boolean;
  rollback_method: string | null;
  max_effect_scope: "none" | "staging" | "canary" | "production";
  execute: (request: ActuatorRequest) => ActuatorResult;
}

export function requiresExplicitHumanApproval(
  adapter: ActuatorAdapter,
  request: ActuatorRequest,
): boolean {
  if (adapter.effect_reversibility !== "irreversible") {
    return false;
  }
  return request.approval_level < 2;
}

export function createDryRunOnlyAdapter(
  name: string,
  effectClass: EffectClass,
): ActuatorAdapter {
  return {
    actuator_name: name,
    actuator_version: "1.0.0",
    effect_class: effectClass,
    effect_reversibility: "reversible",
    requires_credentials: [],
    supports_dry_run: true,
    supports_rollback: true,
    rollback_method: "in-memory-revert",
    max_effect_scope: "staging",
    execute: (request) => {
      if (!request.dry_run) {
        return {
          ok: false,
          dry_run: false,
          effect_applied: false,
          rollback_available: true,
          message: "dry_run_required",
          output: {},
        };
      }
      return {
        ok: true,
        dry_run: true,
        effect_applied: false,
        rollback_available: true,
        message: "dry_run_ok",
        output: { action: request.action },
      };
    },
  };
}
