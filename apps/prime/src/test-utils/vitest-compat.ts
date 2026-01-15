import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "@jest/globals";

// Export jest as vi directly so that vi.mock === jest.mock
// This preserves the calling context for mock hoisting
export const vi = jest;

// Re-export jest globals
export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
};

export type Mock = jest.Mock;
export type SpyInstance = jest.SpyInstance;
