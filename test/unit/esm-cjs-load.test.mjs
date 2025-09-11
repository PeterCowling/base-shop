import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ESM module with dynamic import
await test('loads ESM module via dynamic import', async () => {
  const mod = await import('./fixtures/fake-module.mjs');
  assert.equal(mod.default, 'fake-module');
});

// CJS module with require
await test('loads CJS module via require', () => {
  const mod = require('./fixtures/fake-module.js');
  assert.equal(mod, 'fake-module');
});
