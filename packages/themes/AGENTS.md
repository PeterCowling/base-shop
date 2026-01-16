# themes — Agent Notes

## Purpose
Theme packages (tokens and CSS) consumed by CMS and storefronts.

## Operational Constraints
- Each theme directory is a package; keep directory names stable.
- Token keys must remain consistent across themes to avoid runtime missing-token
  errors.
- Avoid deleting or renaming tokens without a migration plan and CMS updates.

## Safe Change Checklist
- If a token is added, add it across all theme packages.
- Keep `tokens.static.css` and `tokens.dynamic.css` output in sync with source.
- Validate at least one storefront and CMS theme preview after changes.
