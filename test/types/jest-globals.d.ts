// Centralized type augmentation for @jest/environment Jest interface
// Adds missing async methods that exist in the actual Jest runtime but
// may be missing from older type definitions

import type { Jest as OriginalJest } from "@jest/environment";

declare module "@jest/environment" {
  // Augment the existing Jest interface to include async methods
  // This merges with the existing interface rather than replacing it
  export interface Jest {
    /**
     * Equivalent of `jest.isolateModules()` for async functions to be wrapped.
     * The caller is expected to `await` the completion of `jest.isolateModulesAsync()`.
     */
    isolateModulesAsync(fn: () => Promise<void>): Promise<void>;

    /**
     * Asynchronously advances all timers by the specified number of milliseconds.
     * All pending "macro-tasks" that have been queued via setTimeout() or setInterval(),
     * and would be executed during this time frame, will be executed.
     *
     * This is the async version of `jest.advanceTimersByTime()` and should be used
     * when working with fake timers and async code.
     */
    advanceTimersByTimeAsync(msToRun: number): Promise<void>;

    /**
     * Asynchronously exhausts both the macro-task queue and the micro-task queue.
     * This will run all pending timers and their callbacks.
     *
     * This is the async version of `jest.runAllTimers()` and should be used
     * when working with fake timers and async code.
     */
    runAllTimersAsync(): Promise<void>;
  }
}
