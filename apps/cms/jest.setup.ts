import { webcrypto } from 'node:crypto';

// Ensure a reliable Web Crypto API for libs that expect browser crypto.
// Works in both node and jsdom environments.
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  configurable: true,
  writable: false,
  enumerable: true,
});
