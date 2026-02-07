/**
 * Global This Mock Utility
 *
 * Provides a helper for creating Jest mocks that avoid the common
 * "Cannot access 'X' before initialization" error caused by Jest's
 * mock hoisting behavior.
 *
 * ## The Problem
 *
 * When you write:
 * ```ts
 * const mockFn = jest.fn();
 * jest.mock("./module", () => ({
 *   exportedFn: mockFn
 * }));
 * ```
 *
 * Jest hoists the `jest.mock()` call to the top of the file, but the
 * `const mockFn = jest.fn()` declaration stays in place. This means
 * the mock factory runs before `mockFn` is initialized, causing:
 * ```
 * ReferenceError: Cannot access 'mockFn' before initialization
 * ```
 *
 * ## The Solution
 *
 * Use globalThis to store the mock, which is always available:
 * ```ts
 * import { createGlobalThisMock } from "~test/setup/globalThisMock";
 *
 * const mockFn = createGlobalThisMock<jest.Mock>("myUniqueName", jest.fn());
 *
 * jest.mock("./module", () => ({
 *   get exportedFn() {
 *     return (globalThis as any).__mockMyUniqueName;
 *   },
 * }));
 * ```
 *
 * The getter ensures the mock is retrieved at call time, not factory time.
 *
 * @example
 * // Basic usage with a simple mock function
 * const logMock = createGlobalThisMock<jest.Mock>("logger", jest.fn());
 *
 * jest.mock("./logger", () => ({
 *   get log() { return (globalThis as any).__mockLogger; },
 * }));
 *
 * // In tests:
 * logMock.mockReturnValue("test");
 * expect(logMock).toHaveBeenCalled();
 *
 * @example
 * // Usage with an object of mocks
 * const repoMocks = createGlobalThisMock("shopRepo", {
 *   getById: jest.fn(),
 *   update: jest.fn(),
 * });
 *
 * jest.mock("./shopRepo", () => ({
 *   get getById() { return (globalThis as any).__mockShopRepo.getById; },
 *   get update() { return (globalThis as any).__mockShopRepo.update; },
 * }));
 */

/**
 * Creates a mock value stored on globalThis to avoid Jest's mock hoisting issues.
 *
 * @param name - A unique identifier for this mock. Will be prefixed with `__mock`
 *               and stored on globalThis. Use camelCase (e.g., "shopRepository").
 * @param initialValue - The initial mock value. Typically `jest.fn()` or an object
 *                       containing multiple jest.fn() mocks.
 * @returns The mock value, which can be used directly in tests.
 *
 * @remarks
 * The mock is stored at `(globalThis as any).__mock${PascalCaseName}`.
 * For example, `createGlobalThisMock("shopRepo", jest.fn())` stores at
 * `globalThis.__mockShopRepo`.
 */
export function createGlobalThisMock<T>(name: string, initialValue: T): T {
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  const globalKey = `__mock${pascalName}` as const;

  // Store on globalThis so it's available before any module code runs
  (globalThis as Record<string, unknown>)[globalKey] = initialValue;

  return initialValue;
}

/**
 * Retrieves a mock value from globalThis.
 *
 * @param name - The same name used in createGlobalThisMock
 * @returns The mock value, or undefined if not found
 *
 * @example
 * // In mock factory (where you can't use the returned reference):
 * jest.mock("./module", () => ({
 *   get fn() { return getGlobalThisMock("myMock"); },
 * }));
 */
export function getGlobalThisMock<T>(name: string): T | undefined {
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  const globalKey = `__mock${pascalName}`;
  return (globalThis as Record<string, unknown>)[globalKey] as T | undefined;
}

/**
 * Generates the globalThis key for a mock name.
 * Useful for building mock factories.
 *
 * @param name - The mock name
 * @returns The globalThis key (e.g., "__mockShopRepo")
 *
 * @example
 * const key = globalThisMockKey("shopRepo"); // "__mockShopRepo"
 * jest.mock("./shopRepo", () => ({
 *   get default() { return (globalThis as any)[key]; },
 * }));
 */
export function globalThisMockKey(name: string): string {
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  return `__mock${pascalName}`;
}
