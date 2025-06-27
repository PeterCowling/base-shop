import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { server } from "./test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
