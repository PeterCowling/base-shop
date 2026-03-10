---
Title: XA uploader — raw i18n keys shown for untranslated strings
Slug: xa-uploader-i18n-raw-keys
Status: Infeasible
Business: XA
Domain: SELL
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Delivery-Readiness: 0%
Last-updated: 2026-02-28
Source-Dispatch: IDEA-DISPATCH-20260228-0071
---

## Summary

Dispatch claimed the XA uploader UI shows raw i18n keys for untranslated strings.
Investigation found this claim cannot be reproduced. The i18n system is structurally
sound: `getUploaderMessage` always returns a proper `string` with EN fallback, and
both EN and ZH bundles are complete with matching key sets. No raw key is ever shown.

## Kill Rationale

The i18n system cannot display raw key strings — `getUploaderMessage` always falls
back to the full English value when a ZH translation is absent, and both locale
bundles are complete (191 keys each, zero gaps), so the claimed failure mode has no
viable reproduction path in the current codebase.

## Access Declarations

None — investigation was codebase-only.

## Routing Header

```yaml
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
```

## Investigation Summary

### Entry points examined

| File | Role | Finding |
|---|---|---|
| `apps/xa-uploader/src/lib/uploaderI18n.ts` | Bundle + accessor | EN=191 keys, ZH=191 keys, 0 gaps; `getUploaderMessage` returns `bundle[key] ?? messages.en[key]` — always a string |
| `apps/xa-uploader/src/lib/uploaderI18n.client.tsx` | Hook | `useUploaderI18n()` exposes `t(key: UploaderMessageKey)` — strongly typed at the hook boundary |
| `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` | Feedback utilities | `Translator = (key: string, ...)` — weaker type than `UploaderMessageKey`, no runtime impact |
| `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` | Action handlers | All `t()` calls use valid key literals; `toErrorMap(parsed.error, t)` always passes `t` |
| `apps/xa-uploader/src/components/catalog/catalogConsoleUtils.ts` | Schema localization | `localizeSchemaIssueMessage(msg, t?)`: raw Zod message only if `t` absent; sole call site always passes `t` |
| `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` | Sync UI | All user-visible text uses `t()` or pre-translated state values |
| `apps/xa-uploader/src/components/catalog/CatalogLoginForm.client.tsx` | Auth UI | All user-visible text uses `t()` — XAUP-0001 disable covers design token rules only |
| `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` | Console hook | `syncReadiness.error` is always set to `t("syncReadinessCheckFailed")` or `null` — never a raw API string |

### Key technical findings

**Claim disproven — no raw key display path exists**

The accessor chain is:
1. `t(key: UploaderMessageKey)` in hook → calls `getUploaderMessage(locale, key)`
2. `getUploaderMessage` returns `bundle[key] ?? messages.en[key]`
3. Both EN and ZH bundles have identical key sets (191 each) — no missing translation
4. If a key were somehow absent from both bundles, React would render `undefined` as an empty string — not the raw key string

There is no code path in which a raw key like `"syncReadinessReady"` would appear as visible UI text.

**Secondary finding — Translator type gap (no runtime effect)**

`catalogConsoleFeedback.ts` and `catalogConsoleActions.ts` define:
```typescript
type Translator = (key: string, vars?: Record<string, unknown>) => string;
```
rather than `(key: UploaderMessageKey, ...)`. This allows a developer to call `t("misspelledKey")` without a TypeScript compile error. At runtime the result would be an empty string, not a raw key. All current call sites use valid key literals. No user-visible defect exists today.

This gap is already tracked under XAUP-0001 (TTL 2026-12-31) as part of the i18n
stubs-pending-centralization debt.

**Origin of dispatch claim**

The dispatch appears to have inferred "raw keys shown" from the XAUP-0001 comment
`"uploader i18n stubs pending centralization"` in `uploaderI18n.ts`. "Stubs" refers
to the i18n system being a self-contained local implementation (not using the repo's
centralized i18n infrastructure), not to missing translations.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bundle completeness (EN vs ZH) | Yes | None | No |
| `getUploaderMessage` fallback path | Yes | None | No |
| `Translator` type at call sites | Yes | Minor: `key: string` instead of `key: UploaderMessageKey` | No (no runtime effect, covered by XAUP-0001) |
| `localizeSchemaIssueMessage` without `t` | Yes | Path exists but unreachable — all call sites pass `t` | No |
| UI components rendering readiness/error state | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed

- Confirmed bundle key counts and parity with Python key comparison
- Traced all `t()` call sites and confirmed valid key literals at each
- Traced `syncReadiness.error` propagation — never set to raw API string
- Confirmed `localizeSchemaIssueMessage` raw path is unreachable in production

### Confidence Adjustments

None — investigation was conclusive. Claim disproven with high confidence.

### Remaining Assumptions

None material. The conclusion is not assumption-dependent.

## Open Questions

None. All questions self-resolved during investigation.

## Secondary Recommendation

The `Translator = (key: string, ...)` type in `catalogConsoleFeedback.ts` and
`catalogConsoleActions.ts` should be tightened to `(key: UploaderMessageKey, ...)`
when the XAUP-0001 i18n centralization work is executed. No dedicated plan is needed;
this is a 2-line change suitable for inclusion in the XAUP-0001 cleanup pass.
