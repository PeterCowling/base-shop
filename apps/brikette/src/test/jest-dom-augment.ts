// Applies @testing-library/jest-dom matcher types to the TypeScript compilation.
// Covers both @types/jest global matchers and @jest/globals module matchers.
// This file is picked up by tsconfig.test.typecheck.json (src/test/**/*.ts).
// It is NOT run by jest (no .test suffix).
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
