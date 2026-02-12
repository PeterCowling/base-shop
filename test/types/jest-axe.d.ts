declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core';

  export interface JestAxeConfigureOptions extends RunOptions {
    globalOptions?: Spec;
  }

  export interface AxeFunction {
    (html: Element | string, options?: RunOptions): Promise<AxeResults>;
  }

  export function configureAxe(options?: JestAxeConfigureOptions): AxeFunction;

  export const axe: AxeFunction;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      message(): string | undefined;
      actual?: AxeResults['violations'];
    };
  };
}
