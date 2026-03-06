# Critique History: xa-uploader-status-and-media-model-rewrite

## Round 1 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Critical | Dependency & Impact Map, Risks, Task Seeds | xa-b omitted from blast radius: XaCartContext reads sku.stock, inventoryStore reads product.stock, XaImageGallery reads media role — removing both breaks storefront cart and degrades accessibility |
| 1-02 | Major | Questions / Open, Task Seeds, Delivery-Readiness | Migration strategy unresolved (break-and-fix vs compatibility shim for legacy CSV rows) — creates planning blocker for persistence IMPLEMENT task |
| 1-03 | Moderate | Questions / Open | xa-b availability model post-stock-removal undefined — cart quantity logic (max={sku.stock}) requires coordinated update strategy |
| 1-04 | Moderate | Frontmatter | Trigger-Why and Trigger-Intended-Outcome blank despite Dispatch-ID present in queue-state |
| 1-05 | Minor | Suggested Task Seeds | out_of_stock vs "out of stock" naming inconsistency — enum vs UI copy not distinguished |
| 1-06 | Minor | Evidence Audit | CatalogProductImagesFields.client.tsx:802 line claim slightly offset (role logic is at 809-810) |

### Issues Confirmed Resolved This Round
None (first round).

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Critical | 1 | xa-b blast radius omission — partially resolved by operator answers on availability model and image ordering; xa-b IMPLEMENT task seed added; Risks table updated |
| 1-02 | Major | 1 | CSV migration strategy unresolved — demoted to plan-phase DECISION task; no longer blocks planning |
| 1-03 | Moderate | 1 | xa-b availability model — RESOLVED by operator: status ≠ out_of_stock → cart available |
| 1-04 | Moderate | 1 | Trigger-Why / Trigger-Intended-Outcome blank — RESOLVED: fields populated from Outcome Contract |
| 1-05 | Minor | 1 | out_of_stock naming inconsistency — RESOLVED: schema uses out_of_stock, UI copy uses "out of stock" |
| 1-06 | Minor | 1 | Line number offset at CatalogProductImagesFields:802 — acknowledged, evidence substantively correct |

## Round 1 Operator Inputs — 2026-03-06

- xa-b availability: cart availability = status ≠ `out_of_stock`. No numeric stock field required.
- xa-b image ordering: numeric index ordering; `main` image is always first. No role-based ordering or labels.
- Fact-find status promoted back to `Ready-for-planning`. CSV migration strategy remains as a DECISION task in the plan.

## Round 2 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Evidence Audit, Dependency & Impact Map, Test Landscape, Task Seeds | Status-rewrite surface omitted the sync publish route's `ready | live` filter, understating implementation scope and missing required test updates |
| 2-02 | Moderate | Frontmatter | `Last-reviewed` and `Relates-to charter` were missing despite the repo's current fact-find pattern and AGENTS metadata requirements |
| 2-03 | Moderate | Questions / Open | The only open question lacked a `Decision owner`, weakening handoff to planning |
| 2-04 | Moderate | Scope Signal | Scope rationale still described the work as effectively one-app / one-export-path even though xa-b and the sync publish pipeline were already in scope |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Critical | xa-b blast radius omission | Verified current brief already names xa-b cart, inventory, cart page, and gallery consumers in Dependency & Impact Map and task seeds |
| 1-02 | Major | Migration strategy framed as a planning blocker | Brief now keeps migration as an operator-owned open question and plan-stage DECISION without treating it as a blocker to planning |
| 1-03 | Moderate | xa-b availability model undefined | Resolved in current brief via operator answer and explicit xa-b task seed |
| 1-04 | Moderate | Trigger-Why / Trigger-Intended-Outcome blank | Verified populated in frontmatter |
| 1-05 | Minor | out_of_stock naming inconsistency | Verified schema/UI copy distinction remains explicit |
| 1-06 | Minor | CatalogProductImagesFields evidence line offset | Current brief still cites the same evidence area; issue remains non-material and does not affect decision quality |

### Issues Carried Open (not yet resolved)
None.

## Round 3 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-02, TASK-03 Validation Contracts | UI-facing IMPLEMENT tasks lacked an explicit link to the required design/contrast/breakpoint QA loop; TASK-04 contained it, but TASK-02/03 did not reference it in their own contracts |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Moderate | UI-facing IMPLEMENT tasks missing explicit QA-loop linkage | Added TC-05/TC-04 references in TASK-02 and TASK-03 validation contracts tying post-build UI QA to TASK-04 |

### Issues Carried Open (not yet resolved)
None.

## Round 4 — 2026-03-06

### Issues Opened This Round
None.

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-02 | Major | CSV migration strategy unresolved | Operator confirmed legacy CSV/cloud draft data does not need to survive; fact-find moved the question to Resolved and plan switched TASK-01 to complete with explicit break-and-fix cleanup |

### Issues Carried Open (not yet resolved)
None.

## Round 4 Operator Inputs — 2026-03-06

- Legacy CSV/cloud draft data does not have to survive.
- Planning artifacts updated to use explicit discard/regenerate cleanup instead of compatibility-preserving reads.
