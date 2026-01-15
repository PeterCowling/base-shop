export interface TransactionStep {
  run: () => Promise<void>;
  rollback?: () => Promise<void>;
}

/**
 * Executes a series of async steps as an atomic transaction.
 * If any step fails, all previously completed steps are rolled back in
 * reverse order. If a rollback itself fails, the error is suppressed so the
 * original failure is surfaced to the caller.
 */
export async function runTransaction(steps: TransactionStep[]): Promise<void> {
  const completed: TransactionStep[] = [];
  for (const step of steps) {
    try {
      await step.run();
      completed.push(step);
    } catch (error) {
      for (const s of completed.reverse()) {
        try {
          await s.rollback?.();
        } catch {
          /* ignore rollback errors */
        }
      }
      throw error;
    }
  }
}
