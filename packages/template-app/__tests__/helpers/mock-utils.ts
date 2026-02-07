import { jest } from "@jest/globals";

/**
 * Create a mock function that returns a resolved promise.
 * This bypasses the @jest/globals typing issues where mockResolvedValue
 * has parameter type 'never'.
 */
export function mockResolving<T>(value: T) {
  return jest.fn(() => Promise.resolve(value));
}

/**
 * Create a mock function that returns a rejected promise.
 */
export function mockRejecting<T>(error: T) {
  return jest.fn(() => Promise.reject(error));
}

/**
 * Type helper to cast a function as a jest.Mock.
 * Use this when you need mock methods like mockResolvedValue, mockClear, etc.
 */
export function asMock<T extends (...args: any[]) => any>(fn: T): jest.Mock<ReturnType<T>, Parameters<T>> {
  return fn as unknown as jest.Mock<ReturnType<T>, Parameters<T>>;
}
