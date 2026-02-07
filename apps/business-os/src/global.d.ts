/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Ensure Jest's expect is the global expect
declare global {
  namespace jest {
    interface Matchers<R = void> {}
  }
  const expect: jest.Expect;
}

export {};
