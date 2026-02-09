// packages/design-tokens/src/index.ts

// Export core tokens
// Export context tokens
import { consumerTokens } from './contexts/consumer'
import { hospitalityTokens } from './contexts/hospitality'
import { operationsTokens } from './contexts/operations'

export * from './core/colors'
export * from './core/containers'
export * from './core/disabled'
export * from './core/letter-spacing'
export * from './core/opacity'
export * from './core/sizes'
export * from './core/spacing'
export * from './core/typography'
export * from './core/z-index'

export { consumerTokens, hospitalityTokens,operationsTokens }

// Export types
export type { ConsumerTokens } from './contexts/consumer'
export type { HospitalityTokens } from './contexts/hospitality'
export type { OperationsTokens } from './contexts/operations'

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
