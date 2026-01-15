# TypeScript Path Aliases

This document explains the path alias configuration across the monorepo and provides guidelines for using them effectively.

## Why Use Path Aliases?

Path aliases improve code maintainability by:

1. **Eliminating deep relative imports** - No more `../../../utils/something`
2. **Making refactoring easier** - Moving files doesn't break import paths
3. **Improving readability** - `@/utils/style` is clearer than `../../utils/style`
4. **Enforcing architecture** - Clear boundaries between layers

## Global Aliases (All Packages)

These aliases are available in every package via [tsconfig.base.json](../tsconfig.base.json):

### Workspace Package Aliases

```typescript
// ✅ Good - Use workspace package names
import { getShop } from '@acme/platform-core'
import { Button } from '@acme/ui'
import { formatDate } from '@acme/date-utils'

// ❌ Bad - Don't use relative paths to other packages
import { getShop } from '../platform-core/src/shops'
import { Button } from '../../ui/src/components/atoms/Button'
```

### Test Utilities

```typescript
// ✅ Good - Use @test-utils alias
import { createMockShop } from '@test-utils/fixtures'
import '@test-utils/resetNextMocks'

// ❌ Bad - Deep relative imports
import { createMockShop } from '../../../../../../test/fixtures'
import '../../../../../../test/resetNextMocks'
```

## Package-Specific Aliases

### @acme/ui Package

Available in [packages/ui/tsconfig.json](../packages/ui/tsconfig.json):

```typescript
// Component imports
import { Button } from '@/components/atoms/Button'
import { Modal } from '@/components/molecules/Modal'

// Utility imports
import { cn } from '@/utils/style'
import { formatPrice } from '@/utils/currency'

// Hook imports
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ❌ Avoid these patterns
import { cn } from '../../../utils/style'
import { Button } from '../../atoms/Button'
```

### Apps (CMS, Shops, etc.)

Each Next.js app has `@/` configured to map to its `src/` directory:

```typescript
// In apps/cms/src/**/*
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { useShop } from '@/hooks/useShop'
import { API_ROUTES } from '@/constants/routes'

// ❌ Don't use
import { DashboardLayout } from '../components/layouts/DashboardLayout'
```

## Common Patterns

### Import Order Convention

Follow this import order for consistency:

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react'
import { z } from 'zod'

// 2. Workspace packages (alphabetical)
import { getShop } from '@acme/platform-core'
import { Button } from '@acme/ui'

// 3. Local imports with aliases (alphabetical)
import { DashboardLayout } from '@/components/layouts'
import { useAuth } from '@/hooks/useAuth'
import { API_ROUTES } from '@/constants'

// 4. Relative imports (only for siblings)
import { helper } from './helper'
import type { Props } from './types'

// 5. Styles
import styles from './Component.module.css'
```

### When to Use Relative Imports

Relative imports are acceptable in these cases:

```typescript
// ✅ Sibling files (same directory)
import { helper } from './helper'
import type { ComponentProps } from './types'

// ✅ Direct children
import { SubComponent } from './SubComponent'

// ❌ Parent or ancestor directories
import { utils } from '../utils'  // Use @/utils instead
import { Component } from '../../Component'  // Use @/components instead
```

## Configuration Guide

### Adding Aliases to a Package

1. Edit the package's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/utils/*": ["src/utils/*"],
      "@/components/*": ["src/components/*"]
    }
  }
}
```

2. For apps using Next.js, ensure `next.config.mjs` doesn't override paths

3. Restart TypeScript server in your IDE:
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
   - WebStorm: File → Invalidate Caches → Restart

### Adding Aliases to Jest

Path aliases need to be mapped in Jest configuration. Check [jest.config.cjs](../jest.config.cjs):

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@acme/ui$': '<rootDir>/packages/ui/src/index',
  '^@test-utils/(.*)$': '<rootDir>/test/$1',
}
```

### Adding Aliases to Storybook

Storybook uses Webpack, so aliases are configured in [apps/storybook/.storybook/main.ts](../apps/storybook/.storybook/main.ts):

```typescript
webpackFinal: async (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, '../../packages/ui/src'),
  }
  return config
}
```

## Troubleshooting

### "Cannot find module '@/...'"

**Cause:** TypeScript doesn't recognize the alias

**Solutions:**
1. Check `baseUrl` is set in tsconfig.json
2. Verify `paths` includes the alias
3. Restart TypeScript server
4. Check VS Code is using workspace TypeScript: Cmd+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

### Imports work in IDE but fail at runtime

**Cause:** Build tool (Next.js, Webpack, etc.) doesn't recognize the alias

**Solutions:**
1. For Next.js: Check `next.config.mjs` doesn't override paths
2. For Jest: Add to `moduleNameMapper` in jest.config.cjs
3. For Storybook: Add to webpack config in .storybook/main.ts

### Circular dependency warnings

**Cause:** Path aliases can mask circular dependencies

**Solutions:**
1. Use more specific imports: `@/utils/style` instead of `@/utils`
2. Split files to break circular dependencies
3. Use dynamic imports for large components

## Migration Guide

### Migrating from Relative to Alias Imports

1. **Find candidates:**
   ```bash
   # Find files with deep relative imports
   grep -r "\.\./\.\./\.\." packages/ui/src --include="*.ts" --include="*.tsx"
   ```

2. **Update imports systematically:**
   ```typescript
   // Before
   import { cn } from '../../../utils/style'

   // After
   import { cn } from '@/utils/style'
   ```

3. **Run tests:**
   ```bash
   pnpm --filter @acme/ui test
   pnpm typecheck
   ```

4. **Use VS Code multi-cursor** for bulk updates:
   - Find: `from ['"]\.\.\/\.\./utils/`
   - Replace: `from '@/utils/`

### Automated Migration (Optional)

Use `jscodeshift` for large-scale refactoring:

```bash
# Install
pnpm add -D jscodeshift

# Create transform
cat > transform-imports.js << 'EOF'
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  root.find(j.ImportDeclaration)
    .filter(path => path.value.source.value.includes('../../utils'))
    .forEach(path => {
      path.value.source.value = path.value.source.value.replace(/.*\/utils/, '@/utils')
    })

  return root.toSource()
}
EOF

# Run transform
npx jscodeshift -t transform-imports.js packages/ui/src/**/*.tsx
```

## Best Practices

### DO

✅ Use aliases for cross-directory imports
✅ Use specific paths: `@/utils/style` not `@/utils`
✅ Keep alias names consistent across packages
✅ Document custom aliases in package README
✅ Use workspace package names for inter-package imports

### DON'T

❌ Don't create too many aliases (cognitive load)
❌ Don't use aliases for sibling files
❌ Don't mix relative and alias imports for the same directory
❌ Don't use deep imports into workspace packages: `@acme/ui/src/internal`
❌ Don't create circular dependencies masked by aliases

## IDE Integration

### VS Code

Recommended settings ([.vscode/settings.json](../.vscode/settings.json)):

```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "javascript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### WebStorm/IntelliJ

1. Settings → Editor → Code Style → TypeScript
2. Imports tab → Use paths relative to: "tsconfig.json"
3. Check "Use paths relative to the closest tsconfig.json"

## Examples

### Before (Deep Relative Imports)

```typescript
// packages/ui/src/components/atoms/Button.tsx
import { cn } from '../../utils/style'
import { useTheme } from '../../../hooks/useTheme'
import { ButtonProps } from './types'
```

### After (Path Aliases)

```typescript
// packages/ui/src/components/atoms/Button.tsx
import { cn } from '@/utils/style'
import { useTheme } from '@/hooks/useTheme'
import type { ButtonProps } from './types'
```

### Cross-Package Imports

```typescript
// apps/cms/src/components/Dashboard.tsx

// ✅ Good
import { getShop } from '@acme/platform-core'
import { Button, Modal } from '@acme/ui'
import { DashboardLayout } from '@/components/layouts'

// ❌ Bad
import { getShop } from '../../../packages/platform-core/src/shops'
import { Button } from '@acme/ui/src/components/atoms/Button'
```

## Reference

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Next.js Absolute Imports](https://nextjs.org/docs/advanced-features/module-path-aliases)
- [tsconfig.base.json](../tsconfig.base.json) - Root paths configuration
- [Architecture Guide](./architecture.md) - Layer boundaries

---

**Last Updated:** 2026-01-12

For questions about path aliases, check this documentation or the package-specific tsconfig.json files.
