import type { Model, Solution, SolutionStatus } from "yalps";
import { solve } from "yalps";

export interface BinaryPortfolioOption {
  id: string;
  utility: number;
  coefficients?: Readonly<Record<string, number>>;
}

export interface PortfolioConstraintSpec {
  key: string;
  min?: number;
  max?: number;
  equal?: number;
}

export interface SolveBinaryPortfolioInput {
  direction?: "maximize" | "minimize";
  options: readonly BinaryPortfolioOption[];
  constraints: readonly PortfolioConstraintSpec[];
}

export interface SolveBinaryPortfolioResult {
  status: SolutionStatus;
  objective_value: number | null;
  selected_option_ids: string[];
  option_values: Record<string, number>;
}

export class PortfolioModelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioModelValidationError";
  }
}

const OBJECTIVE_KEY = "__objective__";
const TIE_BREAK_KEY = "__tie_break__";
const SECONDARY_CONSTRAINT_PRECISION = 1e-8;

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function assertFiniteNumber(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new PortfolioModelValidationError(`${field}_must_be_finite`);
  }
}

function normalizeConstraints(
  constraints: readonly PortfolioConstraintSpec[],
): PortfolioConstraintSpec[] {
  const normalized = constraints.map((constraint) => {
    if (typeof constraint.key !== "string" || constraint.key.trim().length === 0) {
      throw new PortfolioModelValidationError("constraint_key_required");
    }

    const next: PortfolioConstraintSpec = {
      key: constraint.key.trim(),
    };

    if (constraint.equal !== undefined) {
      assertFiniteNumber(constraint.equal, `constraint_equal:${next.key}`);
      next.equal = constraint.equal;
    }
    if (constraint.min !== undefined) {
      assertFiniteNumber(constraint.min, `constraint_min:${next.key}`);
      next.min = constraint.min;
    }
    if (constraint.max !== undefined) {
      assertFiniteNumber(constraint.max, `constraint_max:${next.key}`);
      next.max = constraint.max;
    }
    if (
      next.equal === undefined &&
      next.min === undefined &&
      next.max === undefined
    ) {
      throw new PortfolioModelValidationError(`constraint_bounds_required:${next.key}`);
    }

    return next;
  });

  normalized.sort((left, right) => compareStrings(left.key, right.key));

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1]?.key === normalized[index]?.key) {
      throw new PortfolioModelValidationError(
        `duplicate_constraint_key:${normalized[index]?.key}`,
      );
    }
  }

  return normalized;
}

function normalizeOptions(
  options: readonly BinaryPortfolioOption[],
  allowedConstraintKeys: ReadonlySet<string>,
): BinaryPortfolioOption[] {
  const normalized = options.map((option) => {
    if (typeof option.id !== "string" || option.id.trim().length === 0) {
      throw new PortfolioModelValidationError("option_id_required");
    }
    assertFiniteNumber(option.utility, `option_utility:${option.id}`);

    const coefficients: Record<string, number> = {};
    for (const [constraintKey, coefficient] of Object.entries(option.coefficients ?? {})) {
      if (!allowedConstraintKeys.has(constraintKey)) {
        throw new PortfolioModelValidationError(
          `unknown_constraint_key:${constraintKey}`,
        );
      }
      assertFiniteNumber(coefficient, `option_coefficient:${option.id}:${constraintKey}`);
      coefficients[constraintKey] = coefficient;
    }

    return {
      id: option.id.trim(),
      utility: option.utility,
      coefficients,
    };
  });

  normalized.sort((left, right) => compareStrings(left.id, right.id));

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1]?.id === normalized[index]?.id) {
      throw new PortfolioModelValidationError(
        `duplicate_option_id:${normalized[index]?.id}`,
      );
    }
  }

  return normalized;
}

function toModel(
  input: SolveBinaryPortfolioInput,
  objectiveKey: string,
  options: readonly BinaryPortfolioOption[],
  constraints: readonly PortfolioConstraintSpec[],
): Model<string, string> {
  const constraintMap: Record<string, PortfolioConstraintSpec> = {
    [objectiveKey]: {
      key: objectiveKey,
    },
  };

  for (const constraint of constraints) {
    constraintMap[constraint.key] = constraint;
  }

  const modelConstraints: Record<string, { min?: number; max?: number; equal?: number }> = {};
  for (const constraint of Object.values(constraintMap)) {
    modelConstraints[constraint.key] = {
      ...(constraint.min !== undefined ? { min: constraint.min } : {}),
      ...(constraint.max !== undefined ? { max: constraint.max } : {}),
      ...(constraint.equal !== undefined ? { equal: constraint.equal } : {}),
    };
  }

  const variables: Record<string, Record<string, number>> = {};
  const optionCount = options.length;
  for (const [index, option] of options.entries()) {
    variables[option.id] = {
      [OBJECTIVE_KEY]: option.utility,
      [TIE_BREAK_KEY]: optionCount - index,
      ...option.coefficients,
    };
  }

  return {
    direction: input.direction ?? "maximize",
    objective: objectiveKey,
    constraints: modelConstraints,
    variables,
    binaries: true,
  };
}

function toResult(solution: Solution<string>, objectiveValue: number | null): SolveBinaryPortfolioResult {
  const selectedOptionIds = solution.variables
    .filter(([, value]) => value > 0)
    .map(([id]) => id)
    .sort(compareStrings);

  return {
    status: solution.status,
    objective_value: objectiveValue,
    selected_option_ids: selectedOptionIds,
    option_values: Object.fromEntries(solution.variables),
  };
}

function solveWithTieBreak(
  input: SolveBinaryPortfolioInput,
  options: readonly BinaryPortfolioOption[],
  constraints: readonly PortfolioConstraintSpec[],
): SolveBinaryPortfolioResult {
  const primaryModel = toModel(input, OBJECTIVE_KEY, options, constraints);
  const primarySolution = solve(primaryModel);

  if (primarySolution.status !== "optimal") {
    return {
      status: primarySolution.status,
      objective_value: null,
      selected_option_ids: [],
      option_values: {},
    };
  }

  const objectiveValue = primarySolution.result;
  const secondaryConstraints = [
    ...constraints,
    {
      key: OBJECTIVE_KEY,
      equal: objectiveValue,
    },
  ];
  const secondaryModel = toModel(
    { ...input, direction: "maximize" },
    TIE_BREAK_KEY,
    options,
    secondaryConstraints,
  );
  const secondarySolution = solve(secondaryModel);

  if (secondarySolution.status !== "optimal") {
    return toResult(primarySolution, objectiveValue);
  }

  const objectiveDelta = Math.abs(
    secondarySolution.variables.reduce((total, [optionId, value]) => {
      const option = options.find((entry) => entry.id === optionId);
      return total + (option?.utility ?? 0) * value;
    }, 0) - objectiveValue,
  );

  if (objectiveDelta > SECONDARY_CONSTRAINT_PRECISION) {
    return toResult(primarySolution, objectiveValue);
  }

  return toResult(secondarySolution, objectiveValue);
}

export function solveBinaryPortfolio(
  input: SolveBinaryPortfolioInput,
): SolveBinaryPortfolioResult {
  const constraints = normalizeConstraints(input.constraints);
  const constraintKeys = new Set(constraints.map((constraint) => constraint.key));
  const options = normalizeOptions(input.options, constraintKeys);

  return solveWithTieBreak(input, options, constraints);
}
