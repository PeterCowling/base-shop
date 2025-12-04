Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Prebuild Preview Best Practices

## Layout spec tips
- Treat the preview as a contract. Mock the critical pages and include real spacing and typography tokens so layout breaks are caught early.

## Token mapping strategies
- Map preview tokens directly to the naming used in the design system. Keep a simple prefix scheme so overrides are easy to find later.

## Rollback
- Keep the last successful prebuild handy. If a preview breaks, switch back by redeploying the previous build or toggling the preview flag.

## Versioning
- Tag every preview build with a semver or commit hash. This makes it obvious which preview introduced a change and simplifies comparing builds.
