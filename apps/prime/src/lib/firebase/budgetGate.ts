import {
  firebaseBudgetBaselines,
  type FirebaseBudgetBaselines,
  type FirebaseBudgetFlowId,
} from './budgetBaselines';

export interface FirebaseReadRecord {
  path: string;
  sizeBytes?: number;
  durationMs?: number;
  timestamp?: number;
}

export interface FirebaseMetricsSnapshot {
  queryCount: number;
  activeListeners: number;
  recentQueries: FirebaseReadRecord[];
}

export interface FirebaseFlowBudgetReport {
  flowId: string;
  ok: boolean;
  queryCount: number;
  activeListeners: number;
  maxReads: number;
  maxActiveListeners: number;
  readCountsByPath: Record<string, number>;
  violations: string[];
}

export class FirebaseBudgetViolationError extends Error {
  readonly report: FirebaseFlowBudgetReport;

  constructor(report: FirebaseFlowBudgetReport) {
    super(
      `[Firebase budget gate] ${report.flowId} exceeded budget: ${report.violations.join(
        '; ',
      )}`,
    );
    this.name = 'FirebaseBudgetViolationError';
    this.report = report;
  }
}

function countReadsByMatcher(
  reads: FirebaseReadRecord[],
  matcher: string,
): number {
  return reads.reduce((count, read) => {
    return read.path.includes(matcher) ? count + 1 : count;
  }, 0);
}

export function buildMetricsSnapshot(
  readPaths: string[],
  activeListeners = 0,
): FirebaseMetricsSnapshot {
  const now = Date.now();
  return {
    queryCount: readPaths.length,
    activeListeners,
    recentQueries: readPaths.map((path, index) => ({
      path,
      sizeBytes: 512,
      durationMs: 80,
      timestamp: now + index,
    })),
  };
}

export function evaluateFirebaseFlowBudget(
  flowId: FirebaseBudgetFlowId,
  metrics: FirebaseMetricsSnapshot,
  baselines: FirebaseBudgetBaselines = firebaseBudgetBaselines,
): FirebaseFlowBudgetReport {
  const flow = baselines.flows[flowId];
  if (!flow) {
    throw new Error(
      `Unknown Firebase budget flow "${String(flowId)}". Add it to budgetBaselines first.`,
    );
  }

  const queryCount = Math.max(metrics.queryCount, metrics.recentQueries.length);
  const violations: string[] = [];
  const readCountsByPath: Record<string, number> = {};

  if (queryCount > flow.maxReads) {
    violations.push(
      `reads ${queryCount} > maxReads ${flow.maxReads}`,
    );
  }

  if (metrics.activeListeners > flow.maxActiveListeners) {
    violations.push(
      `activeListeners ${metrics.activeListeners} > maxActiveListeners ${flow.maxActiveListeners}`,
    );
  }

  for (const [matcher, maxReads] of Object.entries(flow.maxReadsByPath)) {
    const count = countReadsByMatcher(metrics.recentQueries, matcher);
    readCountsByPath[matcher] = count;
    if (count > maxReads) {
      violations.push(`path "${matcher}" reads ${count} > ${maxReads}`);
    }
  }

  return {
    flowId,
    ok: violations.length === 0,
    queryCount,
    activeListeners: metrics.activeListeners,
    maxReads: flow.maxReads,
    maxActiveListeners: flow.maxActiveListeners,
    readCountsByPath,
    violations,
  };
}

export function assertFirebaseFlowBudget(
  flowId: FirebaseBudgetFlowId,
  metrics: FirebaseMetricsSnapshot,
  baselines: FirebaseBudgetBaselines = firebaseBudgetBaselines,
): FirebaseFlowBudgetReport {
  const report = evaluateFirebaseFlowBudget(flowId, metrics, baselines);
  if (!report.ok) {
    throw new FirebaseBudgetViolationError(report);
  }
  return report;
}

export function runFirebaseBudgetRegressionGate(
  reports: FirebaseFlowBudgetReport[],
): number {
  const failed = reports.filter((report) => !report.ok);
  return failed.length === 0 ? 0 : 1;
}
