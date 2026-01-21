/**
 * Test Setup Utilities
 *
 * Re-exports commonly used test utilities for convenient importing.
 *
 * @example
 * import { createGlobalThisMock, withMockedFetch, mockFetchJson } from "~test/setup";
 */

export {
  createGlobalThisMock,
  getGlobalThisMock,
  globalThisMockKey,
} from "./globalThisMock";

export {
  withMockedFetch,
  mockFetchJson,
  mockFetchText,
  mockFetchError,
  mockFetchBlob,
  mockHttpErrors,
} from "./fetchMock";
