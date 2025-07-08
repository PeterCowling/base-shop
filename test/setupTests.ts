// tests/setupTests.ts
//--------------------------------------------------
// Jest / Vitest global test‑suite bootstrap
//--------------------------------------------------
import "@testing-library/jest-dom"; // adds useful matchers
import { server } from "./msw/server";

// Establish API mocking before the *entire* test suite.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any runtime request handlers we may add during the tests
// so they don’t leak into other test files.
afterEach(() => server.resetHandlers());

// Clean up once the tests are finished.
afterAll(() => server.close());
