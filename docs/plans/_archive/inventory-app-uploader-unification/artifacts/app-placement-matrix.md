---
Type: Artifact
Status: Complete
---

# App Placement Matrix

## Recommendation
- Create a new standalone app: `apps/inventory-uploader`
- Reuse XA uploader for the operator shell and interaction model.
- Reuse CMS and `platform-core` for inventory/product domain behavior.
- Remove duplicate operator surfaces only after parity is reached.

## Placement Decisions
| Capability | Current home | Decision | Target home | Why |
|---|---|---|---|---|
| Operator shell, gated login, split-pane console, header controls | `apps/xa-uploader` | Reuse pattern, not code ownership | `apps/inventory-uploader` | The user requires the UI to work and look exactly like XA uploader |
| Scope selector | XA uses storefront scope in `useCatalogConsole` | Adapt | `apps/inventory-uploader` | Replace storefront selector with shop selector using the same reset/scoping pattern |
| Shop discovery endpoint | `apps/cms/src/app/api/shops/route.ts` | Keep and reuse initially | CMS first, later optional move to inventory app thin API | Already exists and is enough to power the selector |
| Inventory repository, snapshot read/write/update | `packages/platform-core` | Keep | `packages/platform-core` | Shared domain logic; should not move into app code |
| Inventory import/export parsing and validation | `apps/cms` routes + `platform-core` types/utils | Split | thin app API in `apps/inventory-uploader` over shared `platform-core` logic | Needed in the new app UX, but underlying contracts should stay shared |
| Stock adjustments | CMS UI + `platform-core` repo | Split | UI/API in `apps/inventory-uploader`, repo stays in `platform-core` | Inventory-operator flow belongs in the new app; business logic stays shared |
| Stock inflows | CMS UI + `platform-core` repo | Split | UI/API in `apps/inventory-uploader`, repo stays in `platform-core` | Same reasoning as stock adjustments |
| Low-stock alerts and scheduler | `packages/platform-core` | Keep | `packages/platform-core` | Infrastructure/business rules, not UI |
| Product import preview/commit service | CMS UI + `platform-core` repo | Split | UI/API in `apps/inventory-uploader`, service stays in `platform-core` | Needed for all-product uploader, but core import logic is already shared |
| Product single-item CRUD | Caryina admin | Drop after parity | no long-term dedicated home in Caryina | Too narrow; should be replaced by generalized uploader flows |
| Caryina inventory single-item editor | Caryina admin | Drop after parity | no long-term dedicated home in Caryina | Duplicates inventory-operator capability |
| Central inventory model and routing engine | `packages/platform-core` | Keep and harden | `packages/platform-core` | Core authority candidate; must remain shared infrastructure |
| Central-inventory operator UI | none | Add | `apps/inventory-uploader` | Missing capability if central inventory becomes authority |
| Checkout hold / stock decrement lifecycle | Caryina + `platform-core` | Keep | Caryina calls, `platform-core` owns mechanics | This remains storefront/runtime behavior, not uploader logic |
| Inventory-facing sales / stock-movement ledger | effectively missing | Add | `apps/inventory-uploader` UI over shared event sources | Needed for operator visibility |
| XA-specific catalog publish/deploy/media contract flow | `apps/xa-uploader` | Keep separate | `apps/xa-uploader` | This is XA-specific and should not contaminate inventory v1 |
| CMS inventory pages | `apps/cms` | Keep temporarily, then likely redirect/drop | transitional only | Useful fallback during parity buildout, but redundant once new app is live |
| CMS product import page | `apps/cms` | Keep temporarily, then likely redirect/drop | transitional only | Same duplication story as inventory pages |

## App-by-App Outcome

### `apps/inventory-uploader`
- Add
- This becomes the main operator-facing inventory app.
- It should look and behave like XA uploader.
- It should own:
  - shell and session UX
  - shop selector
  - inventory console
  - inventory import/export UX
  - stock adjustments UX
  - stock inflows UX
  - all-product uploader UX
  - inventory ledger / stock movement visibility

### `packages/platform-core`
- Keep
- This remains the domain and persistence layer.
- It should continue to own:
  - inventory repositories
  - central inventory and routing
  - stock adjustment/inflow services
  - product import services
  - alerts/scheduler
  - checkout hold mechanics

### `apps/cms`
- Keep, then shrink
- CMS should stop being the primary operator surface for inventory once parity exists.
- Near-term:
  - keep shop discovery and existing pages as fallback
  - optionally link into the new inventory app
- Long-term:
  - remove or redirect duplicated inventory/product-upload pages
  - keep broader CMS responsibilities unrelated to inventory uploader work

### `apps/caryina`
- Shrink
- Caryina should keep storefront and checkout behavior.
- Caryina should lose:
  - local product CRUD admin pages
  - local inventory editor pages
- After parity, those pages should redirect or be removed.

### `apps/xa-uploader`
- Keep separate
- XA uploader remains XA-specific.
- Reuse its frontend shell patterns for the new app.
- Do not merge inventory app behavior into XA uploader itself.

## Drop Altogether
- Caryina-local inventory editing UI, once parity exists.
- Caryina-local product CRUD UI, once parity exists.
- Duplicate CMS inventory/product-upload operator screens, once parity exists in the new app.

## Do Not Drop
- `platform-core` inventory and import services.
- `platform-core` central inventory primitives.
- CMS shop-listing and general admin capabilities.
- XA uploader itself.

## Frontend Implication
- The statement "use CMS as a baseline" should now be read as:
  - behavior baseline: yes
  - UI baseline: no
- The UI baseline is XA uploader.
