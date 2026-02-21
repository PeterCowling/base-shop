# Domain: Legal Compliance

**Goal**: Verify site meets legal requirements for EU GDPR, cookie consent, and consumer protection.
**Required output schema**: `{ domain: "legal", status: "pass|fail|warn", checks: [{ id: "<L1>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Checks

- **L1: Cookie consent banner present (EU visitors)**
  - **What:** Load site as EU visitor (or clear cookies and reload); verify cookie consent modal appears
  - **Pass condition:** Consent banner appears on first visit; user can accept/reject; choice is persisted; no tracking cookies before consent
  - **Evidence:** Screenshot of consent banner + network tab showing no tracking requests before consent
  - **Fail condition:** No consent banner, tracking cookies set before consent, cannot reject

- **L1b: Two-phase consent signal check (Consent Mode v2)**
  - **What:** Verify that GA4 Consent Mode v2 signals fire in the correct phases: (a) before consent — `analytics_storage: denied`, no `_ga` cookie, no analytics network requests; (b) after consent accepted — `analytics_storage: granted`, `_ga` cookie set, analytics events visible in GA4 DebugView
  - **Pass condition:** Both phases correct. Before accept: no `_ga` cookie, no analytics beacons. After accept: `_ga` cookie present, DebugView shows events with no consent-denied signal
  - **Evidence:** Network tab screenshots for both states (before/after consent); cookie inspector showing `_ga` absent before and present after
  - **Fail condition:** Analytics firing before consent (`_ga` set on page load); or `_ga` never set after consent; or DebugView empty after consent with no error explanation
  - **Note:** An empty DebugView while consent is still `denied` is correct behaviour — **not a GA4 bug**. DebugView silence with denied consent is expected; only silence *after* accept is a failure.

- **L2: Privacy policy exists and is linked**
  - **What:** Verify privacy policy page exists and is linked from footer and cookie banner
  - **Pass condition:** Privacy policy page returns 200; contains GDPR-required disclosures (data controller, data usage, user rights); linked from footer
  - **Evidence:** Privacy policy URL + screenshot of footer link
  - **Fail condition:** 404, missing GDPR sections, not linked from site

- **L3: Terms of service / Terms and conditions exist**
  - **What:** Verify terms page exists and is linked from footer and checkout (if applicable)
  - **Pass condition:** Terms page returns 200; contains required clauses (liability, jurisdiction, refund/return policy if selling goods); linked from footer
  - **Evidence:** Terms URL + screenshot of footer link
  - **Fail condition:** 404, missing required clauses, not linked

- **L4: Returns/refund policy (e-commerce only)**
  - **What:** For sites selling goods/services, verify returns policy is clear and accessible
  - **Pass condition:** Returns policy page exists or returns section in terms is clear; linked from footer and checkout; complies with EU consumer protection (14-day cooling-off period for distance sales)
  - **Evidence:** Returns policy URL or terms section screenshot
  - **Fail condition:** Missing policy, unclear terms, non-compliant cooling-off period
  - **Note:** Skip if site is purely informational (no sales)

- **L5: Business/contact information disclosed**
  - **What:** Verify site discloses business name, registered address, contact email (required for EU e-commerce)
  - **Pass condition:** Contact/imprint page exists with required info; linked from footer
  - **Evidence:** Contact page URL + screenshot showing required fields
  - **Fail condition:** Missing contact info, incomplete address, no contact link

- **L6: Disclaimers for user-generated content (if applicable)**
  - **What:** If site allows user reviews, comments, or UGC, verify disclaimer exists
  - **Pass condition:** Disclaimer present (e.g., "Opinions are users' own"); moderation policy linked
  - **Evidence:** Disclaimer text screenshot
  - **Fail condition:** UGC present but no disclaimer, no moderation policy
  - **Note:** Skip if no UGC features

## Domain Pass Criteria

All applicable checks pass. One failure blocks launch (legal risk too high).
