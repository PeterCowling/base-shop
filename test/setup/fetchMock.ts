/**
 * Fetch Mock Utilities
 *
 * Provides helpers for mocking the global fetch function in tests.
 * Automatically assigns mocks to `global.fetch` and cleans up after tests.
 *
 * ## The Problem
 *
 * Tests that mock fetch often forget to:
 * 1. Assign the mock to `global.fetch`
 * 2. Clean up after the test
 * 3. Handle multiple response scenarios
 *
 * This leads to errors like:
 * ```
 * TypeError: fetch is not a function
 * ```
 *
 * ## Usage
 *
 * @example
 * // Basic usage - mock resolves to JSON response
 * import { withMockedFetch, mockFetchJson, mockFetchResponse } from "~test/setup/fetchMock";
 *
 * describe("API calls", () => {
 *   it("fetches data", async () => {
 *     const { fetchMock, restore } = withMockedFetch();
 *     fetchMock.mockResolvedValueOnce(mockFetchJson({ data: "test" }));
 *
 *     const result = await myApiCall();
 *     expect(result).toEqual({ data: "test" });
 *
 *     restore(); // Or use afterEach
 *   });
 * });
 *
 * @example
 * // Using the auto-cleanup pattern with beforeEach/afterEach
 * describe("API calls", () => {
 *   let fetchMock: jest.Mock;
 *   let restore: () => void;
 *
 *   beforeEach(() => {
 *     ({ fetchMock, restore } = withMockedFetch());
 *   });
 *
 *   afterEach(() => {
 *     restore();
 *   });
 *
 *   it("works", async () => {
 *     fetchMock.mockResolvedValueOnce(mockFetchJson({ ok: true }));
 *     // ... test code
 *   });
 * });
 */

/**
 * Creates a mock fetch function and assigns it to global.fetch.
 * Returns the mock and a restore function.
 *
 * @returns Object with fetchMock and restore function
 *
 * @example
 * const { fetchMock, restore } = withMockedFetch();
 * fetchMock.mockResolvedValueOnce(mockFetchJson({ data: "test" }));
 * // ... run test
 * restore();
 */
export function withMockedFetch(): {
  fetchMock: jest.Mock;
  restore: () => void;
} {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  global.fetch = fetchMock;

  return {
    fetchMock,
    restore: () => {
      global.fetch = originalFetch;
    },
  };
}

/**
 * Creates a mock Response object that returns JSON data.
 *
 * @param data - The data to return from response.json()
 * @param options - Optional Response options (status, headers, etc.)
 * @returns A Response-like object suitable for mockResolvedValue
 *
 * @example
 * fetchMock.mockResolvedValueOnce(mockFetchJson({ users: [] }));
 * fetchMock.mockResolvedValueOnce(mockFetchJson({ error: "Not found" }, { status: 404, ok: false }));
 */
export function mockFetchJson<T>(
  data: T,
  options: { status?: number; ok?: boolean; headers?: Record<string, string> } = {}
): Partial<Response> {
  const { status = 200, ok = true, headers = {} } = options;

  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(headers),
  };
}

/**
 * Creates a mock Response object that returns text data.
 *
 * @param text - The text to return from response.text()
 * @param options - Optional Response options
 * @returns A Response-like object
 *
 * @example
 * fetchMock.mockResolvedValueOnce(mockFetchText("OK"));
 */
export function mockFetchText(
  text: string,
  options: { status?: number; ok?: boolean; headers?: Record<string, string> } = {}
): Partial<Response> {
  const { status = 200, ok = true, headers = {} } = options;

  return {
    ok,
    status,
    text: jest.fn().mockResolvedValue(text),
    json: jest.fn().mockRejectedValue(new Error("Not JSON")),
    headers: new Headers(headers),
  };
}

/**
 * Creates a mock Response that simulates a network error.
 *
 * @param message - Error message
 * @returns A rejected promise suitable for mockRejectedValue
 *
 * @example
 * fetchMock.mockRejectedValueOnce(mockFetchError("Network error"));
 */
export function mockFetchError(message: string): Error {
  return new Error(message);
}

/**
 * Creates a mock Response that returns a blob.
 *
 * @param blob - The Blob to return
 * @param options - Optional Response options
 * @returns A Response-like object
 */
export function mockFetchBlob(
  blob: Blob,
  options: { status?: number; ok?: boolean; headers?: Record<string, string> } = {}
): Partial<Response> {
  const { status = 200, ok = true, headers = {} } = options;

  return {
    ok,
    status,
    blob: jest.fn().mockResolvedValue(blob),
    headers: new Headers(headers),
  };
}

/**
 * Helper to create common HTTP error responses.
 */
export const mockHttpErrors = {
  notFound: (message = "Not Found") =>
    mockFetchJson({ error: message }, { status: 404, ok: false }),
  unauthorized: (message = "Unauthorized") =>
    mockFetchJson({ error: message }, { status: 401, ok: false }),
  forbidden: (message = "Forbidden") =>
    mockFetchJson({ error: message }, { status: 403, ok: false }),
  badRequest: (message = "Bad Request") =>
    mockFetchJson({ error: message }, { status: 400, ok: false }),
  serverError: (message = "Internal Server Error") =>
    mockFetchJson({ error: message }, { status: 500, ok: false }),
} as const;
