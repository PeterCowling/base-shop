// packages/design-tokens/src/index.ts

// Export core tokens
export * from './core/spacing'
export * from './core/typography'
export * from './core/colors'

// Export context tokens
import { operationsTokens } from './contexts/operations'
import { consumerTokens } from './contexts/consumer'
import { hospitalityTokens } from './contexts/hospitality'

export { operationsTokens, consumerTokens, hospitalityTokens }

// Export types
export type { OperationsTokens } from './contexts/operations'
export type { ConsumerTokens } from './contexts/consumer'
export type { HospitalityTokens } from './contexts/hospitality'

// Phase 1: 3 contexts only
export type TokenContext = 'operations' | 'consumer' | 'hospitality'
export type Density = 'compact' | 'default' | 'comfortable'

// Phase 2: Add dashboard context and spacious density
// export type TokenContext = 'operations' | 'consumer' | 'hospitality' | 'dashboard'
// export type Density = 'compact' | 'default' | 'comfortable' | 'spacious'

/**
 * Get tokens for a specific context
 */
export function getContextTokens(context: TokenContext) {
  switch (context) {
    case 'operations':
      return operationsTokens
    case 'consumer':
      return consumerTokens
    case 'hospitality':
      return hospitalityTokens
    default:
      return consumerTokens
  }
}

// Export Tailwind plugin
export { contextPlugin } from './tailwind-plugin'
