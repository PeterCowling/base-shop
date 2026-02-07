# Business OS E2E Tests

End-to-end tests for the Business OS application using Cypress.

## Test Coverage

The E2E test suite covers these core workflows:

### Board View (`board-view.cy.ts`)
- Home page loading
- Navigation to business boards
- Card display in lanes
- Archive filtering

### Card Operations (`card-operations.cy.ts`)
- Card creation page
- Card detail view
- Card editing
- Card history display

### Idea Submission (`idea-submission.cy.ts`)
- New idea form
- Form validation
- Idea detail viewing

### Plan & People Views (`plan-people-views.cy.ts`)
- Business plan presentation
- People document presentation
- Change request modal
- Change request form validation

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the dev server:
   ```bash
   pnpm dev
   ```
   The app will run on http://localhost:3020

### Run Tests

**Headless mode (CI):**
```bash
pnpm e2e
```

**Interactive mode:**
```bash
pnpm e2e:open
```

### Running Individual Tests

```bash
# Run a specific test file
pnpm e2e --spec cypress/e2e/board-view.cy.ts

# Run tests matching a pattern
pnpm e2e --spec "cypress/e2e/**/card-*.cy.ts"
```

## Test Strategy

These tests are designed to:

1. **Verify core user workflows** - Ensure Pete can perform essential tasks
2. **Handle missing data gracefully** - Tests check if content exists before interacting
3. **Test real browser behavior** - No mocking of Business OS functionality
4. **Avoid false positives** - Conditional assertions based on actual page state

## Notes

- Tests assume the dev server is running on port 3020
- Tests are resilient to empty/missing data (e.g., no cards on board)
- The baseUrl can be overridden with `CYPRESS_BASE_URL` environment variable
- Tests will retry twice in CI mode if they fail (flake tolerance)
