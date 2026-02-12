export interface FirebaseFlowBudget {
  maxReads: number;
  maxActiveListeners: number;
  maxReadsByPath: Record<string, number>;
  rationale: string;
}

export interface FirebaseBudgetBaselines {
  version: number;
  flows: Record<string, FirebaseFlowBudget>;
}

const RAW_BUDGET_BASELINES: unknown = {
  version: 1,
  flows: {
    verify_link_initial: {
      maxReads: 2,
      maxActiveListeners: 0,
      maxReadsByPath: {
        '/api/guest-session': 2,
      },
      rationale:
        'Guest-link validation should remain a low-latency function call path with no realtime listeners.',
    },
    portal_pre_arrival_initial: {
      maxReads: 8,
      maxActiveListeners: 1,
      maxReadsByPath: {
        bookings: 1,
        completedTasks: 1,
        loans: 1,
        guestByRoom: 1,
        financialsRoom: 1,
        preordersData: 1,
        cityTaxData: 1,
        bagStorage: 1,
      },
      rationale:
        'First guarded-home load must hydrate core guest state in one pass without duplicate fan-out reads.',
    },
    arrival_mode_initial: {
      maxReads: 9,
      maxActiveListeners: 1,
      maxReadsByPath: {
        bookings: 1,
        completedTasks: 1,
        loans: 1,
        guestByRoom: 1,
        financialsRoom: 1,
        preordersData: 1,
        cityTaxData: 1,
        bagStorage: 1,
        checkInCode: 1,
      },
      rationale:
        'Arrival-day mode adds check-in-code retrieval but must keep the rest of hydration at pre-arrival cost levels.',
    },
    portal_manual_refetch: {
      maxReads: 12,
      maxActiveListeners: 1,
      maxReadsByPath: {
        bookings: 2,
        loans: 2,
        guestByRoom: 2,
        financialsRoom: 2,
        preordersData: 2,
        cityTaxData: 2,
      },
      rationale:
        'Manual refresh can re-hit key data once, but should not duplicate parallel reads for the same path.',
    },
    portal_cached_revisit: {
      maxReads: 0,
      maxActiveListeners: 0,
      maxReadsByPath: {},
      rationale:
        'Cached revisit inside stale window should use React Query cache and avoid new database reads/listeners.',
    },
    owner_kpi_dashboard_7day: {
      maxReads: 7,
      maxActiveListeners: 0,
      maxReadsByPath: {
        ownerKpis: 7,
      },
      rationale:
        'Owner KPI dashboard 7-day view reads from pre-aggregated ownerKpis/{date} nodes only. One read per day, never scans raw bookings or preArrival data.',
    },
    owner_kpi_dashboard_30day: {
      maxReads: 30,
      maxActiveListeners: 0,
      maxReadsByPath: {
        ownerKpis: 30,
      },
      rationale:
        'Owner KPI dashboard 30-day view reads from pre-aggregated ownerKpis/{date} nodes only. One read per day, never scans raw bookings or preArrival data.',
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function parsePositiveNumber(
  value: unknown,
  fieldPath: string,
  allowZero = true,
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid Firebase budget config at ${fieldPath}: expected number.`);
  }

  if (allowZero) {
    if (value < 0) {
      throw new Error(`Invalid Firebase budget config at ${fieldPath}: expected >= 0.`);
    }
  } else if (value <= 0) {
    throw new Error(`Invalid Firebase budget config at ${fieldPath}: expected > 0.`);
  }

  return value;
}

function parseMaxReadsByPath(
  raw: unknown,
  fieldPath: string,
): Record<string, number> {
  if (!isRecord(raw)) {
    throw new Error(`Invalid Firebase budget config at ${fieldPath}: expected object.`);
  }

  const parsed: Record<string, number> = {};
  for (const [matcher, value] of Object.entries(raw)) {
    parsed[matcher] = parsePositiveNumber(
      value,
      `${fieldPath}.${matcher}`,
      true,
    );
  }

  return parsed;
}

function parseFlowBudget(
  raw: unknown,
  fieldPath: string,
): FirebaseFlowBudget {
  if (!isRecord(raw)) {
    throw new Error(`Invalid Firebase budget config at ${fieldPath}: expected object.`);
  }

  const maxReads = parsePositiveNumber(raw.maxReads, `${fieldPath}.maxReads`, true);
  const maxActiveListeners = parsePositiveNumber(
    raw.maxActiveListeners,
    `${fieldPath}.maxActiveListeners`,
    true,
  );
  const maxReadsByPath = parseMaxReadsByPath(
    raw.maxReadsByPath ?? {},
    `${fieldPath}.maxReadsByPath`,
  );

  if (typeof raw.rationale !== 'string' || raw.rationale.trim().length === 0) {
    throw new Error(
      `Invalid Firebase budget config at ${fieldPath}.rationale: expected non-empty string.`,
    );
  }

  return {
    maxReads,
    maxActiveListeners,
    maxReadsByPath,
    rationale: raw.rationale.trim(),
  };
}

export function parseFirebaseBudgetBaselines(
  raw: unknown,
): FirebaseBudgetBaselines {
  if (!isRecord(raw)) {
    throw new Error('Invalid Firebase budget config at root: expected object.');
  }

  const version = parsePositiveNumber(raw.version, 'version', false);
  if (!isRecord(raw.flows)) {
    throw new Error('Invalid Firebase budget config at flows: expected object.');
  }

  const parsedFlows: Record<string, FirebaseFlowBudget> = {};
  for (const [flowId, flowBudget] of Object.entries(raw.flows)) {
    parsedFlows[flowId] = parseFlowBudget(flowBudget, `flows.${flowId}`);
  }

  return {
    version,
    flows: parsedFlows,
  };
}

export const firebaseBudgetBaselines =
  parseFirebaseBudgetBaselines(RAW_BUDGET_BASELINES);

export type FirebaseBudgetFlowId = keyof typeof firebaseBudgetBaselines.flows;
