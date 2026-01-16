# Add E2E Test

## Context
Create end-to-end tests using Cypress for critical user flows.

## Prerequisites
- Feature to test: `{{feature}}`
- Test file: `apps/cms/cypress/e2e/{{test-name}}.cy.ts`
- Test runner: Cypress

## Workflow

### 1. Create Test File

```typescript
// apps/cms/cypress/e2e/user-registration.cy.ts
describe('User Registration', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('successfully registers a new user', () => {
    // Fill form
    cy.get('[data-testid="name-input"]').type('John Doe')
    cy.get('[data-testid="email-input"]').type('john@example.com')
    cy.get('[data-testid="password-input"]').type('SecurePass123!')

    // Submit
    cy.get('[data-testid="submit-button"]').click()

    // Assert success
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome, John Doe')
  })

  it('shows validation errors for invalid input', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email')
    cy.get('[data-testid="submit-button"]').click()

    cy.contains('Invalid email address').should('be.visible')
  })
})
```

### 2. Use Data Attributes

```typescript
// Add to components
<input data-testid="email-input" />
<button data-testid="submit-button">Submit</button>

// In tests
cy.get('[data-testid="email-input"]').type('test@example.com')
```

### 3. Custom Commands

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/dashboard')
})

// Usage
cy.login('user@example.com', 'password123')
```

### 4. API Mocking

```typescript
it('handles API errors gracefully', () => {
  cy.intercept('POST', '/api/users', {
    statusCode: 500,
    body: { error: 'Server error' },
  })

  cy.get('[data-testid="submit-button"]').click()
  cy.contains('Something went wrong').should('be.visible')
})
```

### 5. Complete User Flow

```typescript
describe('E-commerce Checkout', () => {
  beforeEach(() => {
    cy.login('customer@example.com', 'password')
  })

  it('completes full checkout process', () => {
    // Browse products
    cy.visit('/products')
    cy.get('[data-testid="product-card"]').first().click()

    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click()
    cy.contains('Added to cart').should('be.visible')

    // Go to cart
    cy.get('[data-testid="cart-icon"]').click()
    cy.url().should('include', '/cart')

    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click()

    // Fill shipping info
    cy.get('[data-testid="address-input"]').type('123 Main St')
    cy.get('[data-testid="city-input"]').type('New York')
    cy.get('[data-testid="zip-input"]').type('10001')

    // Payment
    cy.get('[data-testid="card-number"]').type('4242424242424242')
    cy.get('[data-testid="card-expiry"]').type('12/25')
    cy.get('[data-testid="card-cvc"]').type('123')

    // Submit order
    cy.get('[data-testid="place-order"]').click()

    // Confirm success
    cy.contains('Order confirmed').should('be.visible')
    cy.url().should('include', '/order-confirmation')
  })
})
```

## Quality Checks

```bash
# Run E2E tests
pnpm e2e:cms

# Run specific test
pnpm exec cypress run --spec "cypress/e2e/user-registration.cy.ts"
```

## Related
- [Testing documentation](../../__tests__/docs/testing.md)
- [Cypress docs](https://docs.cypress.io)
