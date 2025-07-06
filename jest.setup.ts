// Provide dummy secrets so auth code doesn't throw
process.env.NEXTAUTH_SECRET ??= "test-secret";
// @ts-expect-error  Node’s type is readonly; we override for tests
process.env.NODE_ENV = "development";

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { server } from "./test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
