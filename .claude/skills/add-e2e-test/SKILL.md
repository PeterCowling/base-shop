---
name: add-e2e-test
description: Create end-to-end tests using Cypress for critical user flows. Covers page navigation, form submission, API mocking, and custom commands.
---

# Add E2E Test

Create Cypress end-to-end tests for critical user flows.

## File Location

`apps/cms/cypress/e2e/<test-name>.cy.ts`

## Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/route')
  })

  it('completes the happy path', () => {
    cy.get('[data-testid="input"]').type('value')
    cy.get('[data-testid="submit"]').click()
    cy.url().should('include', '/success')
    cy.contains('Success message').should('be.visible')
  })

  it('shows validation errors', () => {
    cy.get('[data-testid="submit"]').click()
    cy.contains('Required field').should('be.visible')
  })
})
```

## Key Patterns

### Use `data-testid` selectors
```tsx
// Component
<button data-testid="submit-button">Submit</button>

// Test
cy.get('[data-testid="submit-button"]').click()
```

### Custom commands
```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email"]').type(email)
  cy.get('[data-testid="password"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/dashboard')
})
```

### API mocking with `cy.intercept`
```typescript
cy.intercept('POST', '/api/users', {
  statusCode: 500,
  body: { error: 'Server error' },
})
```

## Running Tests

```bash
pnpm e2e:cms
pnpm exec cypress run --spec "cypress/e2e/<test>.cy.ts"
```
