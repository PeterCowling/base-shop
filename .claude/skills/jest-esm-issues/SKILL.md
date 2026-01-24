---
name: jest-esm-issues
description: Fix Jest ESM/CJS compatibility errors. Use when tests fail with "Cannot use import statement outside a module", "import.meta is not defined", or similar ESM/CJS errors.
---

# Jest ESM/CJS Issues

## When to Use

Use this skill when you encounter Jest test failures related to ESM (ECMAScript Modules) vs CJS (CommonJS) compatibility.

## Trigger Patterns

You likely need this skill if you see errors like:
- `Cannot use import statement outside a module`
- `import.meta` is not defined
- `SyntaxError: Unexpected token 'export'`
- `ReferenceError: exports is not defined`
- Module resolution failures in test files

## Quick Fix

Run the test with the CJS preset forced:

```bash
JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts
```

## Understanding the Issue

### Why This Happens

This monorepo uses a mix of ESM and CJS modules:
- Some packages are pure ESM (`"type": "module"` in package.json)
- Some dependencies only ship ESM
- Jest historically expects CJS
- Transform gaps can occur when ESM modules aren't properly transpiled

### When ESM Mode Works

ESM mode (`JEST_FORCE_CJS` not set) works when:
- All imported modules are properly transpiled
- No `import.meta` usage in tested code paths
- Dependencies ship both ESM and CJS

### When to Force CJS

Force CJS mode when:
- Testing code that imports ESM-only dependencies
- `import.meta` errors appear
- Transform errors occur despite correct config

## Workflow

1. **First attempt**: Run test normally
   ```bash
   pnpm --filter <pkg> test -- path/to/file.test.ts
   ```

2. **If ESM error occurs**: Retry with CJS forced
   ```bash
   JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts
   ```

3. **If still failing**: Check for missing transforms
   - Verify `transformIgnorePatterns` in jest config
   - Ensure problematic packages are transformed

4. **For persistent issues**: Check test setup
   - See `test/setup/README.md` for consolidated setup

## Common Pitfalls

- Don't add `"type": "module"` to package.json just to fix test errors
- Don't modify global Jest config for one failing test
- Don't skip tests because of ESM issues
- Do use `JEST_FORCE_CJS=1` as the first-line fix
- Do check if the issue is a missing transform pattern
- Do report persistent ESM issues for consolidation

## Quality Checks

- [ ] Test passes with `JEST_FORCE_CJS=1`
- [ ] If fix required config changes, verify other tests still pass
- [ ] Document any new transform patterns added

## Related

- `docs/testing-policy.md` — Full testing guidelines
- `AGENTS.md` — Testing rules quick reference
