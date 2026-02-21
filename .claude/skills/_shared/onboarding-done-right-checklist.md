# Onboarding "Done Right" Checklist

Generic best practices for auditing any app's onboarding flow. The `/lp-onboarding-audit` skill reads this checklist, customizes it for the target app's purpose and audience, then scores each item against actual code.

**Sections:** A–I | **Items:** ~50 | **Scoring:** Pass / Fail / Partial / N/A

---

## A) Value-first flow (Aha in minutes)

- [ ] Core promise is benefit-led (user outcome), not feature-led.
- [ ] Aha moment is designed, not accidental: onboarding routes the user to the first meaningful result fast (target: < 2–3 minutes).
- [ ] Problem → solution framing exists in the first screens (pain articulated, cure shown).
- [ ] If the product is transformative, before/after is shown (visual, demo, preview).
- [ ] Empty states are designed (first-time screens guide next action, not blank).

## B) Friction discipline (minimize drop-off)

- [ ] No sign-up before value unless strictly required for core functionality.
- [ ] Fields are ruthlessly minimized (every field justified; defer non-essential).
- [ ] Multi-step onboarding has a progress indicator (bar/steps + "finish line" visibility).
- [ ] Onboarding steps count is intentionally tested (not arbitrary).
- [ ] Loading states are used as messaging real estate (tips, proof, next step), not dead spinners.
- [ ] Skeleton loaders used for media/content-heavy screens.

## C) Personalization & micro-commitments

- [ ] Light personalization: a few questions to tailor the experience (kept short).
- [ ] Micro-commitment step exists (simple "Yes" / "I'm in" / tiny ritual) to increase follow-through.
- [ ] Positive feedback after choices ("good choice", "we've got you") to sustain momentum.
- [ ] Progress celebration is baked in (small wins acknowledged).

## D) Trust & reassurance (early credibility)

- [ ] Trust signals included inside onboarding (real testimonials, ratings, usage counts, press — only if true).
- [ ] Support path is obvious and not hidden behind a maze.
- [ ] "What's New" / ongoing improvement signal is visible somewhere relevant.

## E) Permissions & prompts (contextual, not greedy)

- [ ] Notification permission is contextualized with a short "why it helps you" flow before prompting.
- [ ] Review/rating prompt is triggered after the Aha, not at install/open.

## F) Paywall & monetization mechanics

- [ ] Paywall appears during onboarding (timed around peak motivation).
- [ ] Paywall strategy is explicit and tested: hard vs soft paywall.
- [ ] Paywall is re-shown intelligently (e.g., on app open or key moments) without being spammy.
- [ ] Exit-intent offer exists if using soft paywall (discount/alternative plan).
- [ ] After trial start: "You unlocked X" screen + guided next steps (don't drop them into the app cold).
- [ ] Pricing is actively tested (including "radical" anchors, weekly option, lifetime where relevant).
- [ ] Cash-flow reality acknowledged for weekly plans (cohort evaluation period before scaling).

## G) Analytics instrumentation (measure every leak)

- [ ] Full onboarding funnel is tracked (screen-by-screen drop-off) in Mixpanel/Amplitude/etc.
- [ ] Core metrics are defined and watched: install→paid conversion and ARPU (plus retention).
- [ ] A/B testing is continuous, with statistical discipline (no early calling winners).
- [ ] Subscription events and product events are unified (e.g., RevenueCat → analytics) to connect behavior to revenue.
- [ ] "How did you hear about us?" captured during onboarding (directional channel attribution).

## H) Supportability & operational safety

- [ ] "Contact support" auto-includes device/OS/app version metadata.
- [ ] Bug reporting supports gesture/tap capture (or equivalent) to remove ambiguity.
- [ ] Remote config exists for feature flags, pricing text, promos (no app review required to adjust).
- [ ] Kill switch / abuse controls exist for expensive features (e.g., API-heavy functionality).
- [ ] External API outage mode exists (in-app message + graceful degradation).
- [ ] Forced-update mechanism exists for critical bug hotfixes.

## I) Growth loops (only if fit)

- [ ] Referral program is two-sided value (both parties clearly win).
- [ ] Share cards for milestones exist (if progress-based product).
- [ ] Competitive mechanics (leaderboard) only if aligned with product psychology.

---

## Quick Scoring Rubric

**Pass:** ≥ 80% of relevant boxes checked (ignore "only if fit" items if not applicable).

**Risk — any failure in these must-haves:**
- Aha moment not reached quickly (A)
- Sign-up before value when not required (B)
- No onboarding funnel analytics (G)
- No paywall test strategy for paid apps (F)

---

## App Type N/A Guidance

Use these rules when customizing the checklist for a specific app:

| App Type | Typically N/A Sections | Rationale |
|----------|------------------------|-----------|
| Free content app (no accounts) | F (Paywall) | No monetization in onboarding |
| Free guest/companion app | E (Permissions partially), F (Paywall) | No push notifications or payments |
| Enterprise / B2B tool | F (Paywall), I (Growth loops) | Pricing is sales-led, not self-serve |
| Admin / internal tool | D (Trust), E (Permissions), F (Paywall), I (Growth) | Internal users, no monetization |
| Marketing / landing page | B–I (most sections) | Not an interactive app flow |
| Single-purpose utility | C (Personalization), I (Growth) | No segmentation or virality needed |

**Rule:** Even when a section is N/A, the audit must explain WHY (not just skip it).

---

## Evidence Requirements

For each item scored Pass or Fail, cite:
- **Component path** (e.g., `apps/prime/src/components/onboarding/GuestProfileStep.tsx:42`)
- **Test path** (if test coverage exists)
- **Analytics event name** (if instrumented)
- **User-facing behavior** (flow description or screenshot reference)

No item should be marked Pass without evidence.
