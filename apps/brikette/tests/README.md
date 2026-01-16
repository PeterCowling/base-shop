# Brikette Test Suite

This directory contains comprehensive tests for the Brikette application.

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests with Playwright
│   ├── quick-wins/               # Tests for completed quick wins
│   │   ├── skip-links.spec.ts   # Skip-to-content link tests
│   │   ├── test-parallelization.spec.ts  # Test performance validation
│   │   └── security-audit.spec.ts        # Security checks
│   ├── accessibility/            # Accessibility tests
│   │   ├── wcag-compliance.spec.ts       # WCAG 2.1 AA compliance
│   │   ├── keyboard-navigation.spec.ts   # Keyboard accessibility
│   │   └── rtl-support.spec.ts           # RTL language support
│   └── performance/              # Performance tests
│       └── core-web-vitals.spec.ts       # Web Vitals measurements
└── README.md                     # This file
```

## Running Tests

### Prerequisites

1. **Build the application:**
   ```bash
   pnpm --filter @apps/brikette build
   ```

2. **Start the server** (in another terminal):
   ```bash
   pnpm --filter @apps/brikette start
   ```

### All E2E Tests

```bash
# Run all E2E tests
pnpm --filter @apps/brikette test:e2e

# Run with UI mode (interactive)
pnpm --filter @apps/brikette test:e2e:ui

# Run in headed mode (see browser)
pnpm --filter @apps/brikette test:e2e:headed

# Debug mode
pnpm --filter @apps/brikette test:e2e:debug
```

### Specific Test Suites

```bash
# Quick wins validation
pnpm --filter @apps/brikette test:e2e:quick-wins

# Accessibility tests
pnpm --filter @apps/brikette test:e2e:a11y

# Performance tests
pnpm --filter @apps/brikette test:e2e:perf
```

### Specific Test Files

```bash
# Run a single test file
pnpm --filter @apps/brikette test:e2e tests/e2e/quick-wins/skip-links.spec.ts

# Run tests matching a pattern
pnpm --filter @apps/brikette test:e2e --grep "skip links"
```

### Unit Tests

```bash
# Run unit tests
pnpm --filter @apps/brikette test:unit

# Watch mode
pnpm --filter @apps/brikette test:unit:watch
```

## Test Coverage

### Quick Wins Validation

Tests for the improvements completed:

1. **Skip-to-Content Links** (`skip-links.spec.ts`)
   - Keyboard accessibility
   - Multi-language support
   - Proper styling and visibility
   - Mobile support

2. **Test Parallelization** (`test-parallelization.spec.ts`)
   - Vitest configuration validation
   - Performance improvement verification

3. **Security Audit** (`security-audit.spec.ts`)
   - Next.js version verification (CVE fix)
   - Security workflow existence
   - Audit report validation
   - CSP headers check

### Accessibility Tests

1. **WCAG 2.1 AA Compliance** (`wcag-compliance.spec.ts`)
   - Automated Axe testing on all major pages
   - Specific WCAG rule validation
   - Dark mode accessibility
   - Guide page compliance

2. **Keyboard Navigation** (`keyboard-navigation.spec.ts`)
   - All interactive elements accessible
   - Logical tab order
   - No keyboard traps
   - Visible focus indicators
   - Enter/Escape key functionality

3. **RTL Support** (`rtl-support.spec.ts`)
   - Arabic dir="rtl" attribute
   - Text alignment in RTL
   - Navigation positioning
   - Skip links in RTL
   - No horizontal scrolling

### Performance Tests

1. **Core Web Vitals** (`core-web-vitals.spec.ts`)
   - FCP < 1.5s
   - Time to Interactive < 3.5s
   - Lazy loading verification
   - Layout shift prevention
   - Bundle size checks
   - Font loading efficiency

## Browser Support

Tests run against:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Build app
  run: pnpm --filter @apps/brikette build

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: pnpm --filter @apps/brikette test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: apps/brikette/playwright-report/
```

## Debugging Tests

### Visual Debugging

1. **UI Mode** (recommended):
   ```bash
   pnpm --filter @apps/brikette test:e2e:ui
   ```
   - Interactive test runner
   - Time travel debugging
   - Watch mode

2. **Headed Mode**:
   ```bash
   pnpm --filter @apps/brikette test:e2e:headed
   ```
   - See browser while tests run
   - Useful for debugging flaky tests

3. **Debug Mode**:
   ```bash
   pnpm --filter @apps/brikette test:e2e:debug
   ```
   - Pauses before each action
   - Step through tests
   - Inspect page state

### Test Artifacts

Failed tests automatically generate:
- **Screenshots**: `test-results/*/test-failed-*.png`
- **Videos**: `test-results/*/video.webm`
- **Traces**: `test-results/*/trace.zip`

View traces:
```bash
npx playwright show-trace test-results/*/trace.zip
```

## Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/en');

    // Arrange
    const element = page.locator('selector');

    // Act
    await element.click();

    // Assert
    await expect(element).toHaveText('Expected text');
  });
});
```

### Best Practices

1. **Use Semantic Selectors**
   - Prefer `page.locator('button[aria-label="Submit"]')`
   - Over `page.locator('.btn-submit')`

2. **Wait for State**
   - Use `await page.waitForLoadState('networkidle')`
   - Use `await expect(element).toBeVisible()`
   - Avoid `page.waitForTimeout()` unless necessary

3. **Test Isolation**
   - Each test should be independent
   - Don't rely on test execution order
   - Clean up after tests if needed

4. **Descriptive Names**
   - Test names should describe what they verify
   - Use "should" or action verbs
   - Example: "should display error message when form is invalid"

5. **Group Related Tests**
   - Use `test.describe()` blocks
   - Share setup with `beforeEach`

## Accessibility Testing

### Axe Integration

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('page is accessible', async ({ page }) => {
  await page.goto('/en');
  await injectAxe(page);

  await checkA11y(page, null, {
    detailedReport: true,
  });
});
```

### Manual Testing Checklist

- [ ] Tab through all interactive elements
- [ ] Test with VoiceOver/NVDA
- [ ] Check color contrast (4.5:1 ratio)
- [ ] Verify ARIA labels
- [ ] Test at 200% zoom
- [ ] Test in RTL languages

## Performance Testing

### Measuring Web Vitals

```typescript
const metrics = await page.evaluate(() => {
  return new Promise((resolve) => {
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(e => e.name === 'first-contentful-paint');

    resolve({
      fcp: fcp?.startTime || 0,
      // ... other metrics
    });
  });
});

expect(metrics.fcp).toBeLessThan(1500); // < 1.5s
```

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase timeout in playwright.config.ts
- Check if server is running
- Verify baseURL is correct

**Flaky tests:**
- Add proper waits (`waitForLoadState`)
- Use `await expect().toBeVisible()` instead of `isVisible()`
- Check for race conditions

**Accessibility violations:**
- Run Axe manually to see details
- Check browser console for warnings
- Verify ARIA attributes are correct

**RTL tests failing:**
- Ensure Arabic translations are present
- Check if dir="rtl" is set correctly
- Verify logical CSS properties are used

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Axe Accessibility Testing](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)

## Test Plan

For the complete test strategy and implementation roadmap, see:
- [Test Plans](../../docs/brikette-test-plans.md)
- [Improvement Plan](../../docs/brikette-improvement-plan.md)

---

**Last Updated:** 2026-01-12
