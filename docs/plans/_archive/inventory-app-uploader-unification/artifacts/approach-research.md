# Approach Research

## 1. XA-Uploader Frontend Approach for Inventory Upload

### Conclusion
- Reuse XA uploader's frontend shell and console interaction model.
- Do not reuse XA uploader's catalog-publish backend assumptions by default.
- Build a new app, `apps/inventory-uploader`, that visually and behaviorally mirrors XA uploader while swapping XA's storefront scope for shop scope.

### In-Repo Evidence
- Shell and page framing already exist and are isolated:
  - `apps/xa-uploader/src/app/UploaderShell.client.tsx`
  - `apps/xa-uploader/src/app/UploaderHome.client.tsx`
- The split-pane operator console already matches the required mental model:
  - left pane = selector/list
  - right pane = active editor/workspace
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- Scoped-state switching already exists:
  - XA uses storefront switching and resets selection/draft state cleanly.
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`

### Required Flexibility for Inventory
- Replace XA storefront scope with a shop selector.
- Keep the shell constant while allowing multiple inventory modes inside the right panel:
  - inventory snapshot editor
  - stock inflows
  - stock adjustments
  - inventory ledger/history
  - all-product uploader
- Preserve XA patterns that are still useful:
  - gated login
  - header action slot
  - split-pane layout
  - scoped-state reset on selector change
  - local storage of last selected scope
- Drop XA assumptions that are not inventory-first:
  - catalog deploy drain
  - storefront publish sync
  - XA-specific contract service wiring

### Recommended UI Mapping
| XA concept | Inventory app equivalent |
|---|---|
| storefront selector | shop selector |
| product list in left rail | inventory workspaces plus context-aware item list |
| product form | inventory editor or uploader workspace |
| currency side-screen | inventory sub-screen, for example ledger or routing |

## 2. Non-Inventory Scope: Port, Rehome, or Drop

### Keep in `platform-core`
- Inventory repositories
- Central inventory and routing primitives
- Product import service layer
- Stock adjustment and stock inflow service layers
- Low-stock alerting and scheduling
- Checkout hold / stock decrement lifecycle

Reason:
- These are shared domain/infrastructure concerns and should remain app-agnostic.

### Port to the New App (`apps/inventory-uploader`)
- XA-style shell and session UX
- Shop selector and shop-scoped console state
- Inventory snapshot UI
- Stock inflow UI
- Stock adjustment UI
- Inventory history / ledger UI
- All-product uploader UI
- Any future central-inventory routing UI

Reason:
- These are operator-facing inventory workflows and need one coherent home.

### Keep Temporarily in CMS, Then Likely Redirect/Drop
- CMS inventory page
- CMS stock inflows page
- CMS stock adjustments page
- CMS product import page

Reason:
- They are useful as fallback during parity buildout, but become redundant once the new app reaches feature parity.

### Drop from Caryina After Parity
- Caryina local product CRUD admin pages
- Caryina local inventory editor

Reason:
- They are narrow, shop-specific duplicates of the generalized operator tooling.

### Keep Separate in XA-Uploader
- XA-specific catalog publish pipeline
- XA-specific media upload and contract sync
- XA-specific deploy orchestration

Reason:
- These are not inventory-first concerns and should not be dragged into v1 inventory architecture.

## 3. Multi-Shop Inventory Frontend Optimized for Cloudflare Workers + Next.js + React 19

### Current Repo Runtime Baseline
- `apps/xa-uploader`, `apps/cms`, and `apps/caryina` are already aligned on:
  - `next` `16.1.6`
  - `react` `19.2.1`
  - `react-dom` `19.2.1`

Reason:
- The inventory app does not need a framework upgrade track first. It should be added directly on the repo's current Next.js 16 / React 19 baseline.

### Official Platform Constraints
- Cloudflare Workers Paid is currently a minimum of $5 USD/month for the account, with Workers, Pages Functions, KV, Hyperdrive, and Durable Objects included at baseline usage.
  - Source: https://developers.cloudflare.com/workers/platform/pricing/
- CPU limits can be configured per invocation.
  - Source: https://developers.cloudflare.com/workers/platform/pricing/
- OpenNext Cloudflare supports Next.js 16 with the Node.js runtime.
  - Source: https://opennext.js.org/cloudflare
- `nodejs_compat` and compatibility date `2024-09-23` or later are required.
  - Source: https://opennext.js.org/cloudflare/get-started
- Worker size matters: OpenNext notes 10 MiB compressed on Workers Paid.
  - Source: https://opennext.js.org/cloudflare
- Next.js 16 aligns with React 19.2 features in App Router.
  - Source: https://nextjs.org/blog/next-16

### Architecture Implications
- Use a single OpenNext Cloudflare worker app for `apps/inventory-uploader`.
- Match the repo's current runtime baseline rather than introducing a divergent stack.
- Prefer same-app route handlers over cross-service fanout where possible.
- Keep auth simple:
  - signed cookie / bearer-token session pattern, like XA uploader
  - avoid introducing KV or Durable Objects just for login/session state unless scaling pressure proves it necessary
- Keep state model lean:
  - shop-scoped client state
  - server persistence in shared repositories
  - no background sync queue unless required
- Keep bindings minimal for v1:
  - likely no KV
  - likely no Durable Objects
  - no R2 unless/until non-inventory media workflow is explicitly brought in

### Multi-Shop Design Guidance
- Load the shop list once and scope all console operations by selected shop.
- Store the last selected shop in local storage, mirroring XA's storefront persistence.
- Reset list/editor/action state on shop change, mirroring XA's storefront reset pattern.
- Build shop-aware APIs rather than duplicating one app per shop.

### Cost/Complexity Guidance for the $5 Workers Context
- Favor:
  - one worker app
  - direct reads/writes to shared repos
  - route handlers over extra services
  - additive reuse of current CMS/platform-core contracts
- Avoid by default:
  - KV-backed mutexes
  - Durable Object coordination
  - browser-rendering features
  - XA-style deploy orchestration
  - unnecessary R2 usage

### Recommended First-Phase Shape
- `apps/inventory-uploader`
  - XA-style shell
  - shop selector
  - inventory operations
  - all-product uploader
- `packages/platform-core`
  - authoritative domain logic
- `apps/cms`
  - temporary fallback and transitional routing only

### Main Open Technical Caveat
- Central inventory is promising but not yet drop-in authoritative.
- It already exists, but variant-key normalization and integration hardening are still required before it should replace per-shop inventory as the canonical path.
