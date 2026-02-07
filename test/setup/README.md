# Consolidated Jest Setup Files

This directory contains the consolidated Jest setup configuration for the entire monorepo. These files replace the previous scattered setup files that existed across multiple locations.

## Architecture

The setup process is divided into three clear phases that run in sequence:

```
setupFiles (before environment)
  ├─ dotenv/config         (load .env)
  └─ env.ts                (Phase 1: Environment variables)

setupFilesAfterEnv (after environment initialized)
  ├─ polyfills.ts          (Phase 2: Browser/Node polyfills)
  └─ mocks.ts              (Phase 3: MSW, global mocks, utilities)
```

## Phase 1: Environment (`env.ts`)

**Runs:** Before Jest's test environment (jsdom/node) is initialized
**Purpose:** Configure environment variables and Browserslist settings

### Responsibilities:
- Silence Browserslist staleness warnings (`BROWSERSLIST_IGNORE_OLD_DATA`)
- Make `process.env` re-assignable for tests that swap environments
- Set default test environment variables:
  - `NODE_ENV` (defaults to "development")
  - `CART_COOKIE_SECRET`, `STRIPE_WEBHOOK_SECRET`
  - `EMAIL_FROM`, `EMAIL_PROVIDER`
  - `CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`
  - Auth secrets (`NEXTAUTH_SECRET`, `SESSION_SECRET`) with minimum 32-char length
  - `STRIPE_USE_MOCK=true` (use mock Stripe client by default)

### Why it runs early:
Environment variables must be set before any code that reads them is loaded. This includes polyfills and library initialization code.

### Restrictions:
- Avoid importing code that requires the DOM or global mocks
- Keep this file minimal and fast

## Phase 2: Polyfills (`polyfills.ts`)

**Runs:** After environment is initialized, before tests
**Purpose:** Provide runtime polyfills for missing browser/Node APIs

### Responsibilities:
- **Timer APIs:** `setImmediate`, `clearImmediate`
- **Fetch API:** `fetch`, `Response`, `Request`, `Headers`, `FormData`
- **Web Streams:** `TransformStream`, `ReadableStream`
- **Web Crypto:** `crypto.subtle` and related APIs
- **DOM APIs:**
  - `TextEncoder`, `TextDecoder`
  - `BroadcastChannel` (for MSW v2)
  - `ResizeObserver` (for Radix UI)
  - `MessageChannel` (for React 19+ scheduler)
  - `URL.createObjectURL`, `URL.revokeObjectURL`
  - `Element.prototype.scrollIntoView`
  - `HTMLElement` pointer capture methods
  - `HTMLFormElement.requestSubmit`
- **Response.json():** Static method polyfill
- **React Compatibility:** `IS_REACT_ACT_ENVIRONMENT`, internal aliases
- **Global Functions:** `confirm()` stub

### Implementation:
This file re-exports existing polyfill files for organization:
- `../polyfills/dom-compat.ts` - DOM/runtime polyfills
- `../setupFetchPolyfill.ts` - Fetch + web streams
- `../setup-response-json.ts` - Response.json() static method
- `../polyfills/react-compat.ts` - React ACT + MessageChannel
- `../polyfills/form-request-submit.ts` - JSDOM form submission

### Why it runs after environment:
Polyfills need access to globals like `globalThis`, `window`, and `document` which are only available after the test environment is initialized.

## Phase 3: Mocks (`mocks.ts`)

**Runs:** Last, after polyfills are loaded
**Purpose:** Set up global mocks and test infrastructure

### Responsibilities:

#### Testing Library:
- Import `@testing-library/jest-dom` matchers
- Configure `testIdAttribute: "data-cy"`

#### Next.js Mocks:
- `next/navigation` (useRouter, useSearchParams, etc.)
- Mock implementations allow components to render without a router

#### i18n Mock:
- Default English translations for `useTranslations()`
- Caching system for translator functions
- `TranslationsProvider` mock component
- Tests can override by mocking `@acme/i18n` locally

#### MSW (Mock Service Worker):
- Server lifecycle hooks (beforeAll, afterEach, afterAll)
- Can be disabled via `MSW_DISABLE=1` env var
- Handles MSW v2 teardown errors gracefully

#### NextAuth Mock State:
- Reset mock session between tests (`auth.__resetMockSession()`)
- Reset JWT mocks (`authJwt.__resetMockToken()`)
- Reset React hooks (`authReact.__resetReactAuthImpls()`)

#### Console Noise Filtering:
- Filter known noisy messages (JSDOM navigation, env validation, etc.)
- Patch `console.error` and `console.warn` globally
- Tests can still spy on console via `jest.spyOn()`

### Why it runs last:
Mocks depend on polyfills being available (e.g., MSW needs fetch, i18n mock needs React).

## Package-Specific Setup

Packages that need additional setup should import the consolidated files first, then add their own setup:

```typescript
// apps/cms/jest.setup.ts
import "../../test/setup/env";
import "../../test/setup/polyfills";
import "../../test/setup/mocks";

// CMS-specific additions only
import "./msw/server";
process.env.CMS_TEST_ASSUME_ADMIN = "1";
```

### When to add package-specific setup:
- Additional MSW handlers for package-specific APIs
- Package-specific environment variables
- Custom polyfills for package-specific libraries
- Extra mocks for package-specific dependencies

### When NOT to add setup:
- General polyfills (add to `polyfills.ts` instead)
- General mocks (add to `mocks.ts` instead)
- Environment variables needed by all tests (add to `env.ts` instead)

## Migration from Old Setup Files

This consolidation replaces the following scattered setup files:

| Old File | Lines | Now Part Of |
|----------|-------|-------------|
| `/jest.setup.ts` | 370 | All three phases |
| `/test/setupFetchPolyfill.ts` | 111 | `polyfills.ts` |
| `/packages/ui/jest.setup.local.ts` | 47 | `polyfills.ts` (BroadcastChannel) |
| `/apps/cms/jest.setup.ts` | 11 | `env.ts` (auth secrets) |
| `/apps/cms/jest.setup.after.ts` | 76 | `polyfills.ts` + `mocks.ts` |
| `/apps/cms/jest.setup.polyfills.ts` | 10 | `polyfills.ts` |
| `/apps/cms/jest.env.ts` | 13 | `env.ts` |
| `/apps/api/jest.setup.ts` | 14 | `polyfills.ts` |
| `/apps/reception/jest.setup.ts` | 5 | N/A (global React) |

### Important: Old files are NOT deleted yet

The old setup files remain in place for backwards compatibility during migration. Packages using the new consolidated preset will use `test/setup/*` files automatically. Packages not yet migrated continue using their existing setup files.

## Debugging Setup Issues

### Check setup file execution order:
```bash
# Add debug logging to each setup file
echo "console.log('Phase 1: env');" >> test/setup/env.ts
echo "console.log('Phase 2: polyfills');" >> test/setup/polyfills.ts
echo "console.log('Phase 3: mocks');" >> test/setup/mocks.ts

pnpm --filter <package> test
```

### Check which setup files are being used:
```bash
cd packages/some-package
npx jest --showConfig | jq '.configs[0].setupFiles'
npx jest --showConfig | jq '.configs[0].setupFilesAfterEnv'
```

### Common issues:

**"Cannot find module '../polyfills/dom-compat'"**
- Ensure `test/polyfills/` directory exists
- Check that polyfill files have correct paths in `polyfills.ts`

**"process.env.X is undefined"**
- Check `env.ts` sets the variable
- Ensure `env.ts` runs before code that reads it
- Verify `setupFiles` includes `env.ts`

**"ResizeObserver is not defined"**
- Polyfills may not have loaded
- Check `setupFilesAfterEnv` includes `polyfills.ts`
- Ensure polyfill file imports work correctly

## Future Improvements

### Potential Phase 4: Package-Specific Setup Loader
For packages with complex setup needs, consider a loader pattern:

```typescript
// test/setup/package-loader.ts
const pkgSetup = path.join(process.cwd(), "jest.setup.ts");
if (fs.existsSync(pkgSetup)) {
  require(pkgSetup);
}
```

### MSW Server Per-Package
Some packages may want different MSW handlers. Consider:
```typescript
// test/setup/msw-loader.ts
const pkgMswServer = path.join(process.cwd(), "test/msw/server.ts");
if (fs.existsSync(pkgMswServer)) {
  const { server } = require(pkgMswServer);
  // Set up lifecycle hooks
}
```

## Related Documentation

- **Phase 0:** `test/jest-baselines/README.md` - Config snapshot comparison
- **Preset Usage:** `packages/config/jest-presets/README.md` - How to use presets
- **Plan:** `docs/plans/jest-preset-consolidation-plan.md` - Full migration plan
- **CLAUDE.md:** Testing section - AI assistant guidance

## Maintenance

When adding new polyfills or mocks:

1. **Determine the correct phase:**
   - Environment variable? → `env.ts`
   - Browser/Node API polyfill? → `polyfills.ts`
   - Global mock or test utility? → `mocks.ts`

2. **Document in the phase file:**
   - Add a comment explaining why the polyfill/mock is needed
   - Include the library or feature that requires it

3. **Keep imports organized:**
   - Group related imports together
   - Add section comments (marked with `===`)
   - Use try-catch for optional features

4. **Test the change:**
   - Run tests in at least one React app and one Node package
   - Verify no new console warnings appear
   - Check that polyfill/mock works as expected

---

**Last Updated:** 2026-01-16 (Claude Sonnet 4.5)
**Related Issues:** Jest preset consolidation plan (Phase 4)
