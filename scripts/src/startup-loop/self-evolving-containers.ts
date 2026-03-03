import type { ActuatorAdapter } from "./self-evolving-actuator.js";
import type {
  ContainerContract,
  ContainerStep,
  StartupState,
} from "./self-evolving-contracts.js";

export interface ContainerExecutionContext {
  startup_state: StartupState;
  contract: ContainerContract;
  input_deltas: Record<string, unknown>;
  actuators: Record<string, ActuatorAdapter>;
  approval_level: 1 | 2 | 3 | 4;
  dry_run: boolean;
}

export interface ContainerExecutionResult {
  ok: boolean;
  executed_steps: string[];
  blocked_reason: string | null;
  outputs: Record<string, unknown>;
}

function defaultSteps(name: string, includeActuator: boolean): ContainerStep[] {
  const steps: ContainerStep[] = [
    {
      step_id: `${name}:preflight`,
      step_type: "validator",
      description: "Validate startup_state and required deltas",
      required: true,
      actor: "system",
    },
    {
      step_id: `${name}:materialize`,
      step_type: "tool_call",
      description: "Materialize contract artifacts",
      required: true,
      actor: "system",
    },
  ];
  if (includeActuator) {
    steps.push({
      step_id: `${name}:actuator`,
      step_type: "actuator_call",
      description: `Apply ${name} staged effects through configured actuator`,
      required: true,
      actor: "system",
    });
  }
  steps.push({
    step_id: `${name}:approval`,
    step_type: "human_approval",
    description: "Approval gate for production-impacting changes",
    required: false,
    actor: "human",
  });
  return steps;
}

function hasNonEmptyObject(input: Record<string, unknown> | null | undefined): boolean {
  return input != null && Object.keys(input).length > 0;
}

function runPreflightChecks(
  contract: ContainerContract,
  startupState: StartupState,
): string | null {
  for (const check of contract.preflight_checks) {
    switch (check) {
      case "startup_state_present":
        if (!startupState.startup_state_id) return "missing_startup_state";
        break;
      case "analytics_stack_present":
      case "analytics_instrumented":
        if (!startupState.analytics_stack?.provider) return "missing_analytics_stack";
        break;
      case "kpi_definitions_present":
      case "activation_kpi_present":
      case "kpi_baseline_present":
        if ((startupState.kpi_definitions ?? []).length === 0) {
          return "missing_kpi_definitions";
        }
        break;
      case "brand_present":
        if (
          startupState.brand.do_rules.length === 0 ||
          startupState.brand.dont_rules.length === 0
        ) {
          return "missing_brand_data";
        }
        break;
      case "offer_present":
        if (!hasNonEmptyObject(startupState.offer)) return "missing_offer_data";
        break;
      case "icp_present":
        if (!hasNonEmptyObject(startupState.icp)) return "missing_icp_data";
        break;
      case "channels_enabled_present":
        if ((startupState.channels_enabled ?? []).length === 0) {
          return "channel_not_enabled";
        }
        break;
      case "feedback_channels_available":
        if ((startupState.channels_enabled ?? []).length === 0) {
          return "no_feedback_source_available";
        }
        break;
      case "website_generation_lte_1":
        if (startupState.current_website_generation > 1) {
          return "website_generation_not_eligible_for_v1";
        }
        break;
      case "website_generation_eq_2":
        if (startupState.current_website_generation !== 2) {
          return "website_generation_not_eligible_for_v2";
        }
        break;
      case "website_generation_gte_3":
        if (startupState.current_website_generation < 3) {
          return "website_generation_not_eligible_for_v3";
        }
        break;
      default:
        break;
    }
  }
  return null;
}

export const STARTUP_MOTION_CONTAINERS: Record<string, ContainerContract> = {
  "analytics-v1": {
    container_name: "analytics-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+run_id+container_version",
    startup_state_ref: "required",
    required_inputs: ["tracking_schema_delta", "dashboard_target_delta"],
    preflight_checks: ["startup_state_present", "analytics_stack_present", "kpi_definitions_present"],
    steps: defaultSteps("analytics-v1", false),
    state_store_contract: "writes_observation_and_contract_artifacts",
    outputs: ["event_schema", "kpi_snapshot_contract", "dashboard_contract"],
    acceptance_checks: ["kpi_integrity_validator_pass"],
    blocked_reason_enum: ["missing_startup_state", "missing_kpi_definitions"],
    rollback_plan: "revert_instrumentation_contract",
    kpi_contract: "kpi_snapshot_quality_ok",
    experiment_hook_contract: "none",
    actuator_refs: [],
  },
  "website-v1": {
    container_name: "website-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+website_surface+container_version",
    startup_state_ref: "required",
    required_inputs: ["site_scope_delta"],
    preflight_checks: [
      "startup_state_present",
      "brand_present",
      "offer_present",
      "website_generation_lte_1",
    ],
    steps: defaultSteps("website-v1", true),
    state_store_contract: "writes_site_contract_artifacts",
    outputs: ["website_build_contract", "qa_checklist", "launch_readiness_notes"],
    acceptance_checks: ["build_contract_complete", "qa_gate_attached"],
    blocked_reason_enum: [
      "missing_brand_data",
      "missing_offer_data",
      "deploy_target_unset",
      "website_generation_not_eligible_for_v1",
    ],
    rollback_plan: "restore_previous_site_contract_snapshot",
    kpi_contract: "website_activation_baseline",
    experiment_hook_contract: "website_variant_hook_optional",
    actuator_refs: ["site-repo-adapter"],
  },
  "experiment-cycle-v1": {
    container_name: "experiment-cycle-v1",
    container_version: "1.0.0",
    maturity_level: "M3",
    idempotency_key_strategy: "business+experiment_hypothesis+window",
    startup_state_ref: "required",
    required_inputs: ["hypothesis_delta", "variant_delta", "traffic_allocation_delta"],
    preflight_checks: ["experiment_policy_present", "kpi_baseline_present"],
    steps: defaultSteps("experiment-cycle-v1", true),
    state_store_contract: "writes_experiment_registry_and_decision_artifacts",
    outputs: ["experiment_registry_entry", "decision_artifact"],
    acceptance_checks: ["decision_validity_checks_pass"],
    blocked_reason_enum: ["insufficient_sample_size", "data_quality_not_ok"],
    rollback_plan: "revert_variant_assignment_and_restore_control",
    kpi_contract: "experiment_target_kpi_and_guardrails",
    experiment_hook_contract: "self",
    actuator_refs: ["traffic-allocation-adapter"],
  },
  "website-v2": {
    container_name: "website-v2",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+website_iteration+container_version",
    startup_state_ref: "required",
    required_inputs: ["upgrade_delta"],
    preflight_checks: [
      "website_v1_exists",
      "analytics_v1_exists",
      "website_generation_eq_2",
    ],
    steps: defaultSteps("website-v2", true),
    state_store_contract: "writes_upgrade_contract_artifacts",
    outputs: ["upgrade_contract", "release_notes"],
    acceptance_checks: ["canary_ready"],
    blocked_reason_enum: [
      "missing_upgrade_evidence",
      "website_generation_not_eligible_for_v2",
    ],
    rollback_plan: "restore_previous_release_candidate",
    kpi_contract: "post_upgrade_conversion_kpi",
    experiment_hook_contract: "website_upgrade_variants",
    actuator_refs: ["site-repo-adapter"],
  },
  "website-v3": {
    container_name: "website-v3",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+website_generation+container_version",
    startup_state_ref: "required",
    required_inputs: ["upgrade_delta"],
    preflight_checks: [
      "website_v1_exists",
      "analytics_v1_exists",
      "website_generation_gte_3",
    ],
    steps: defaultSteps("website-v3", true),
    state_store_contract: "writes_upgrade_contract_artifacts",
    outputs: ["upgrade_contract", "release_notes", "experiment_plan"],
    acceptance_checks: ["canary_ready", "experiment_hook_attached"],
    blocked_reason_enum: [
      "missing_upgrade_evidence",
      "website_generation_not_eligible_for_v3",
    ],
    rollback_plan: "restore_previous_release_candidate",
    kpi_contract: "post_upgrade_conversion_kpi",
    experiment_hook_contract: "website_upgrade_variants",
    actuator_refs: ["site-repo-adapter"],
  },
  "offer-v1": {
    container_name: "offer-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+offer_version",
    startup_state_ref: "required",
    required_inputs: ["offer_delta"],
    preflight_checks: ["startup_state_present", "icp_present"],
    steps: defaultSteps("offer-v1", false),
    state_store_contract: "writes_offer_contract_artifacts",
    outputs: ["offer_contract", "pricing_hypothesis"],
    acceptance_checks: ["offer_acceptance_criteria_met"],
    blocked_reason_enum: ["missing_icp_data"],
    rollback_plan: "revert_offer_revision",
    kpi_contract: "offer_conversion_kpi",
    experiment_hook_contract: "offer_variant_hook",
    actuator_refs: [],
  },
  "distribution-sprint-v1": {
    container_name: "distribution-sprint-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+distribution_sprint_window",
    startup_state_ref: "required",
    required_inputs: ["channel_delta"],
    preflight_checks: ["channels_enabled_present"],
    steps: defaultSteps("distribution-sprint-v1", true),
    state_store_contract: "writes_distribution_artifacts",
    outputs: ["channel_execution_packet", "tracking_checklist"],
    acceptance_checks: ["channel_goals_defined"],
    blocked_reason_enum: ["channel_not_enabled"],
    rollback_plan: "pause_distribution_changes",
    kpi_contract: "acquisition_kpi_contract",
    experiment_hook_contract: "channel_experiment_hook",
    actuator_refs: ["content-publish-adapter"],
  },
  "activation-loop-v1": {
    container_name: "activation-loop-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+activation_window",
    startup_state_ref: "required",
    required_inputs: ["activation_delta"],
    preflight_checks: ["analytics_instrumented", "activation_kpi_present"],
    steps: defaultSteps("activation-loop-v1", true),
    state_store_contract: "writes_activation_loop_artifacts",
    outputs: ["activation_plan", "onboarding_updates"],
    acceptance_checks: ["activation_measurements_configured"],
    blocked_reason_enum: ["missing_activation_measurement"],
    rollback_plan: "restore_previous_onboarding_flow",
    kpi_contract: "activation_rate_contract",
    experiment_hook_contract: "activation_variant_hook",
    actuator_refs: ["product-config-adapter"],
  },
  "feedback-intel-v1": {
    container_name: "feedback-intel-v1",
    container_version: "1.0.0",
    maturity_level: "M2",
    idempotency_key_strategy: "business+feedback_cycle",
    startup_state_ref: "required",
    required_inputs: ["feedback_delta"],
    preflight_checks: ["feedback_channels_available"],
    steps: defaultSteps("feedback-intel-v1", false),
    state_store_contract: "writes_feedback_intelligence_artifacts",
    outputs: ["feedback_theme_report", "ranked_improvements"],
    acceptance_checks: ["themes_linked_to_kpis"],
    blocked_reason_enum: ["no_feedback_source_available"],
    rollback_plan: "archive_feedback_cycle_without_promotion",
    kpi_contract: "feedback_to_kpi_mapping",
    experiment_hook_contract: "feedback_driven_experiment_hook",
    actuator_refs: [],
  },
};

export function getContainerContract(containerName: string): ContainerContract {
  const contract = STARTUP_MOTION_CONTAINERS[containerName];
  if (!contract) {
    throw new Error(`unknown_container:${containerName}`);
  }
  return contract;
}

export function executeContainer(
  context: ContainerExecutionContext,
): ContainerExecutionResult {
  const executedSteps: string[] = [];
  const outputs: Record<string, unknown> = {
    container_name: context.contract.container_name,
    container_version: context.contract.container_version,
    maturity_level: context.contract.maturity_level,
  };

  if (!context.startup_state.startup_state_id) {
    return {
      ok: false,
      executed_steps: executedSteps,
      blocked_reason: "missing_startup_state",
      outputs,
    };
  }

  const preflightFailure = runPreflightChecks(context.contract, context.startup_state);
  if (preflightFailure) {
    return {
      ok: false,
      executed_steps: executedSteps,
      blocked_reason: preflightFailure,
      outputs,
    };
  }

  for (const requiredInput of context.contract.required_inputs) {
    if (!(requiredInput in context.input_deltas)) {
      return {
        ok: false,
        executed_steps: executedSteps,
        blocked_reason: `missing_required_input:${requiredInput}`,
        outputs,
      };
    }
  }

  for (const step of context.contract.steps) {
    if (step.step_type === "actuator_call") {
      const adapterName = context.contract.actuator_refs[0];
      const adapter = adapterName ? context.actuators[adapterName] : null;
      if (!adapter) {
        return {
          ok: false,
          executed_steps: executedSteps,
          blocked_reason: "missing_actuator_adapter",
          outputs,
        };
      }
      const result = adapter.execute({
        action: step.description,
        dry_run: context.dry_run,
        payload: context.input_deltas,
        approval_level: context.approval_level,
      });
      if (!result.ok) {
        return {
          ok: false,
          executed_steps: [...executedSteps, step.step_id],
          blocked_reason: result.message,
          outputs: {
            ...outputs,
            actuator_result: result.output,
          },
        };
      }
      outputs.actuator_result = result.output;
    }
    if (step.step_type === "human_approval" && context.approval_level < 2) {
      return {
        ok: false,
        executed_steps: executedSteps,
        blocked_reason: "approval_required",
        outputs,
      };
    }
    executedSteps.push(step.step_id);
  }

  for (const outputKey of context.contract.outputs) {
    outputs[outputKey] = {
      generated: true,
      dry_run: context.dry_run,
    };
  }

  return {
    ok: true,
    executed_steps: executedSteps,
    blocked_reason: null,
    outputs,
  };
}
