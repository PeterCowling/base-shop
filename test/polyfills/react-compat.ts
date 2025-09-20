/**
 * Shared React/Next polyfills for Jest environments.
 *
 * Centralizes fragile shims that tend to drift across setup files:
 * - IS_REACT_ACT_ENVIRONMENT flag
 * - React.act() fallback
 * - React internal aliasing (__SECRET_INTERNALS__ ↔ __CLIENT_INTERNALS__)
 * - Response.json() (via shared setup)
 * - MessageChannel stub (shared)
 */

// Ensure React Testing Library and React DOM treat this as an act-capable env
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Load the Response.json() shim once for all suites
// Keep as a separate file so other Node-only test presets can reuse it.
// eslint-disable-next-line import/no-relative-packages
import "../setup-response-json";

// Ensure MessageChannel doesn't leave open handles in Jest
// eslint-disable-next-line import/no-relative-packages
import "./messageChannel";

// React compatibility shims
// eslint-disable-next-line @typescript-eslint/no-var-requires
const React: any = require("react");

// React 19 experimental builds may not ship a public `act`; provide a minimal one.
if (typeof React.act !== "function") {
  React.act = (callback: () => void | Promise<void>) => {
    const result = callback();
    return result && typeof (result as any)?.then === "function"
      ? result
      : Promise.resolve(result);
  };
}

// Alias internal fields across React/ReactDOM variants used by Next.js.
const CLIENT = "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";
const SECRET = "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED";
if (React[CLIENT] && !React[SECRET]) {
  React[SECRET] = React[CLIENT];
} else if (React[SECRET] && !React[CLIENT]) {
  React[CLIENT] = React[SECRET];
}

try {
  // Some React canaries omit react-dom/test-utils.act; mirror React.act when absent.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TestUtils: any = require("react-dom/test-utils");
  if (typeof TestUtils.act !== "function") {
    TestUtils.act = React.act;
  }
} catch {
  // react-dom/test-utils not required in all environments; ignore if unavailable
}
