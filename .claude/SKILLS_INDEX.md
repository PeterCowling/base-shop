# Recommended Claude Skills for This Monorepo

This document outlines custom skills/prompts that should be added to maximize Claude's effectiveness in this codebase.

## Workflow Modes (Ralph Methodology)

These are the primary workflow prompts — use them for structured work:

- **plan-feature.md** - **Planning mode**: Create detailed plans before implementation
- **build-feature.md** - **Building mode**: Implement tasks one-by-one from approved plans

## Priority 1: Essential Skills (Implemented)

### Already Created
- **create-ui-component.md** - Create new components following atomic design
- **migrate-to-app-router.md** - Migrate Pages Router to App Router (for Reception migration)
- **apply-design-system.md** - Use design tokens correctly

## 🚀 Priority 2: High-Impact Skills (Recommended Next)

### Frontend & Component Development
1. **refactor-component.md** - Refactor components to improve maintainability
2. **add-component-variants.md** - Add variants and props to existing components
3. **make-component-responsive.md** - Add responsive design to components
4. **add-dark-mode-support.md** - Implement dark mode correctly
5. **create-page-template.md** - Create new page templates

### Next.js Specific
6. **create-server-action.md** - Create type-safe server actions
7. **add-route-handler.md** - Create API route handlers with validation
8. **optimize-page-performance.md** - Improve Core Web Vitals
9. **add-metadata-seo.md** - Add proper metadata and SEO
10. **implement-streaming-suspense.md** - Use streaming and Suspense correctly

### Testing
11. **add-component-tests.md** - Write comprehensive component tests
12. **add-integration-tests.md** - Create integration tests
13. **add-e2e-test.md** - Create Cypress E2E tests
14. **fix-failing-tests.md** - Debug and fix test failures
15. **add-storybook-story.md** - Create Storybook stories

### Database & Backend
16. **create-prisma-model.md** - Add new Prisma models
17. **add-repository-method.md** - Extend repository pattern
18. **create-api-endpoint.md** - Create API endpoints with validation
19. **add-database-migration.md** - Create database migrations
20. **optimize-database-queries.md** - Improve query performance

### State Management & Data
21. **create-xstate-machine.md** - Create state machines
22. **add-form-validation.md** - Add form validation with Zod/react-hook-form
23. **implement-data-caching.md** - Add caching strategies
24. **add-optimistic-updates.md** - Implement optimistic UI updates

### Monorepo Management
25. **create-workspace-package.md** - Scaffold new workspace package
26. **migrate-external-code.md** - Migrate code into monorepo
27. **fix-dependency-conflict.md** - Resolve workspace dependency issues
28. **update-package-exports.md** - Update package.json exports

### Internationalization & Accessibility
29. **add-i18n-translation.md** - Add translations for new features
30. **improve-accessibility.md** - Add ARIA labels and keyboard navigation
31. **add-rtl-support.md** - Add right-to-left language support
32. **audit-wcag-compliance.md** - Check WCAG AA compliance

### Performance & Optimization
33. **optimize-bundle-size.md** - Reduce bundle size
34. **add-image-optimization.md** - Optimize images with next/image
35. **implement-lazy-loading.md** - Add lazy loading
36. **add-prefetching.md** - Implement prefetching strategies

### DevOps & Deployment
37. **add-ci-workflow.md** - Create GitHub Actions workflow
38. **deploy-to-cloudflare.md** - Deploy app to Cloudflare Pages
39. **add-environment-variable.md** - Add and validate env variables
40. **setup-monitoring.md** - Add monitoring and error tracking

## 🎨 Domain-Specific Skills

### CMS (Content Management)
41. **create-cms-configurator.md** - Add CMS configurator features
42. **create-page-builder-block.md** - Add Page Builder blocks
43. **add-cms-validation.md** - Add CMS validation rules
44. **create-shop-template.md** - Create new shop templates

### E-commerce & Rental
45. **add-product-variant.md** - Add product variants
46. **implement-cart-logic.md** - Add cart functionality
47. **create-checkout-flow.md** - Build checkout steps
48. **add-payment-method.md** - Integrate payment methods
49. **implement-deposit-logic.md** - Handle rental deposits

### Email & Marketing
50. **create-email-template.md** - Create email templates
51. **add-email-automation.md** - Set up email automation
52. **create-marketing-segment.md** - Create customer segments
53. **implement-analytics.md** - Add analytics tracking

## 🛠️ Utility Skills

### Code Quality
54. **fix-eslint-errors.md** - Fix linting errors
55. **fix-type-errors.md** - Resolve TypeScript errors
56. **improve-code-coverage.md** - Increase test coverage
57. **refactor-for-readability.md** - Improve code readability
58. **extract-reusable-logic.md** - Extract utilities/hooks

### Documentation
59. **document-api.md** - Document API endpoints
60. **create-component-docs.md** - Document component props
61. **write-migration-guide.md** - Create migration guides
62. **update-changelog.md** - Update CHANGELOG.md

### Bug Fixes & Debugging
63. **debug-hydration-error.md** - Fix React hydration errors
64. **debug-memory-leak.md** - Find and fix memory leaks
65. **fix-infinite-loop.md** - Fix infinite render loops
66. **debug-race-condition.md** - Fix race conditions

## 📋 Skills Implementation Template

Each skill should follow this structure:

```markdown
# [Skill Name]

## Context
What this skill does and when to use it

## Prerequisites
- What you need before starting
- Required knowledge
- Files that should exist

## Workflow
1. Step-by-step instructions
2. Use appropriate tools
3. Follow architectural patterns
4. Run tests
5. Verify output

## Quality Checks
- [ ] Validation steps
- [ ] Tests pass
- [ ] Types check
- [ ] Follows conventions

## Common Pitfalls
❌ Anti-patterns to avoid
✅ Correct patterns to follow

## Example
Concrete example of usage

## Related
- Links to docs
- Related skills
```

## 🎯 Quick Start Guide for Adding Skills

### For High-Priority Skills (Do Next)
1. Start with testing skills (11-15) - Will improve quality immediately
2. Add Prisma/backend skills (16-20) - Frequently needed
3. Add form and validation skills (22) - Common pattern

### For Medium-Priority Skills
4. Add CMS-specific skills (41-44) - Domain knowledge
5. Add performance skills (33-36) - Optimization
6. Add e-commerce skills (45-49) - Domain features

### For Lower-Priority Skills
7. Add utility skills as needed - On-demand
8. Add documentation skills - When docs grow
9. Add debugging skills - When patterns emerge

## 📊 Skill Categories by Use Case

### Daily Development
- create-ui-component
- add-component-tests
- refactor-component
- fix-eslint-errors
- fix-type-errors

### Feature Development
- create-server-action
- add-route-handler
- create-prisma-model
- add-form-validation
- implement-data-caching

### Migration Projects (Reception)
- migrate-to-app-router ✅
- create-page-template
- add-metadata-seo
- add-route-handler
- implement-streaming-suspense

### Quality & Performance
- add-component-tests
- improve-accessibility
- optimize-page-performance
- audit-wcag-compliance
- improve-code-coverage

### Monorepo Management
- create-workspace-package
- migrate-external-code
- fix-dependency-conflict
- update-package-exports

## 🚀 Implementation Priority Matrix

| Priority | Category | Skills | Impact | Effort |
|----------|----------|--------|--------|--------|
| 🔴 Critical | Component Dev | 1-5 | High | Low |
| 🔴 Critical | Testing | 11-15 | High | Medium |
| 🟡 High | Backend | 16-20 | High | Medium |
| 🟡 High | Next.js | 6-10 | High | Low |
| 🟢 Medium | State/Forms | 21-24 | Medium | Medium |
| 🟢 Medium | Performance | 33-36 | Medium | Low |
| 🔵 Low | DevOps | 37-40 | Medium | High |
| 🔵 Low | Docs | 59-61 | Low | Low |

## 📝 Notes for Implementation

### Best Practices
1. **Keep skills focused** - One clear task per skill
2. **Include examples** - Show actual code from this repo
3. **Reference architecture** - Link to relevant docs
4. **Add quality checks** - Ensure output meets standards
5. **Show anti-patterns** - Teach what NOT to do

### Monorepo-Specific Considerations
- Always mention which package/app to work in
- Include scoped commands (pnpm --filter)
- Reference layer hierarchy for UI components
- Mention package exports vs internal imports
- Include workspace dependency checks

### Testing Integration
- Every skill that creates code should include test guidance
- Reference existing test patterns
- Mention coverage expectations
- Include example test cases

### Documentation
- Link to architecture docs
- Reference existing patterns
- Point to similar implementations
- Include troubleshooting tips

## 🎉 Expected Benefits

### Velocity
- ⚡ Faster feature development
- ⚡ Quicker onboarding
- ⚡ Reduced back-and-forth

### Quality
- ✅ More consistent code
- ✅ Better test coverage
- ✅ Fewer architectural violations

### Knowledge
- 📚 Codified patterns
- 📚 Living documentation
- 📚 Team knowledge sharing

---

**Next Steps:**
1. Review this index with team
2. Prioritize which skills to create next
3. Assign skills to create (can be team effort)
4. Update this index as skills are added
5. Gather feedback and iterate

**Maintenance:**
- Review quarterly
- Add new skills as patterns emerge
- Update existing skills when patterns change
- Archive obsolete skills
