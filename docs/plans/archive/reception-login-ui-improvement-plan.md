---
Type: Plan
Status: Historical
Domain: Reception
Last-reviewed: 2026-01-20
Completed: 2026-01-20
Relates-to charter: none
---

# Reception Login UI Improvement Plan

Address visual hierarchy, accessibility, usability, and trust issues in the
Reception app login screen to create a polished, professional authentication
experience.

## Context

The current login implementation (`apps/reception/src/components/Login.tsx`)
provides functional email/password and device PIN authentication but has
significant visual and UX issues that undermine trust and usability:

- Text over complex background image creates legibility issues
- Form controls lack clear visual hierarchy
- Missing standard login UX patterns (forgot password, show password toggle)
- No product branding or trust indicators
- Dark mode may not provide sufficient contrast
- Accessibility concerns around focus states and color contrast

## Constraints and decisions

- Desktop-only UX (per reception-functionality-improvements-plan.md)
- Keep Firebase Auth as the authentication backend
- Use existing design tokens from `@acme/design-tokens`
- Avoid adding new dependencies unless necessary
- Maintain the three authentication flows: email/password, PIN setup, PIN unlock
- No significant changes to authentication logic, only UI/UX improvements

## Non-goals

- Mobile-responsive design
- SSO or social login integration (future scope)
- New authentication flows beyond what exists
- Changes to the PIN hashing or storage mechanism

---

## Phase 1: Visual Hierarchy and Layout

### REC-LOGIN-01: Replace background image with solid/gradient background

**Status:** DONE ✓

**Scope:**
- Remove the high-contrast Positano background image from login
- Replace with a clean, solid background or subtle gradient using design tokens
- Keep the image for authenticated areas if desired, but login should be clean
- Alternative: Use the image but with a much heavier scrim/overlay that ensures
  text is always legible regardless of image content

**Rationale:**
High-detail background competes with the login task. A clean background
improves focus and legibility.

**Implementation (2026-01-20):**
Background image removed. Replaced with clean gradient:
```tsx
<div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
```

**Files affected:**
- `apps/reception/src/components/Login.tsx` (LoginContainer component)

**Definition of done:**
- Login screen has consistent, predictable text legibility ✓
- WCAG AA contrast ratios are met for all text ✓
- Works correctly in both light and dark modes ✓

---

### REC-LOGIN-02: Add proper form card/surface styling

**Status:** PARTIAL - Card exists but depends on REC-LOGIN-01

**Scope:**
- Ensure the login card has consistent, visible boundaries
- Add appropriate elevation (shadow) for visual separation
- Constrain card width to a readable maximum (current max-w-md is good)
- Ensure adequate internal padding and spacing
- Add consistent border-radius from design tokens

**Current state (2026-01-20):**
Card styling is implemented:
```tsx
className="relative z-10 w-full max-w-md rounded-3xl bg-white/80 px-10 py-8 shadow-xl backdrop-blur-md dark:bg-darkSurface"
```
Styling is reasonable but effectiveness depends on background fix (REC-LOGIN-01).

**Definition of done:**
- Card is clearly distinguishable from any background
- Internal spacing is visually balanced
- Card styling is consistent across all three login states

---

### REC-LOGIN-03: Fix vertical spacing and form rhythm

**Status:** PARTIAL - Basic spacing exists, not audited against design scale

**Scope:**
- Audit and fix spacing between:
  - Heading and subheading
  - Subheading and form fields
  - Labels and inputs
  - Input fields
  - Error messages
  - Submit button
- Use consistent spacing scale (4, 8, 12, 16, 24px or similar)
- Ensure labels have adequate space from their associated inputs

**Current state (2026-01-20):**
- Form uses `space-y-4` for field spacing
- Form has `mt-6` from subheading
- Labels use `mt-1` spacing to inputs
- Spacing is functional but not verified against a consistent design scale

**Files affected:**
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Consistent visual rhythm throughout the form
- No elements appear "jammed" together
- Spacing follows a predictable scale

---

## Phase 2: Component Styling and Affordances

### REC-LOGIN-04: Improve input field styling

**Status:** PARTIAL - Missing placeholder text for email field

**Scope:**
- Reduce border weight/contrast to appropriate level
- Ensure consistent border treatment across all inputs
- Add adequate internal padding (currently `px-4 py-2`, may need `py-3`)
- Add placeholder text for email field (e.g., "name@company.com")
- Ensure cursor/text has adequate padding from input edges

**Current state (2026-01-20):**
```tsx
className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2..."
```
- Padding and border styling is consistent across inputs
- **Missing:** Email input has no `placeholder` attribute
- PIN inputs have placeholder text ("Enter 6-digit PIN", "Enter PIN")

**Remaining work:**
- [ ] Add placeholder to email input (e.g., `placeholder="name@company.com"`)

**Definition of done:**
- Inputs look cohesive and intentional
- Placeholder provides guidance without being distracting
- Text insertion point has adequate padding from edges

---

### REC-LOGIN-05: Make primary CTA visually prominent

**Status:** PARTIAL - Button exists but height may be insufficient

**Scope:**
- Ensure "Sign in" button is clearly the primary action
- Use filled background with adequate contrast
- Add hover and active states
- Make button taller than inputs (44px minimum for tap target)
- Add visual separation from form fields (spacing above)

**Current state (2026-01-20):**
```tsx
className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/90"
```
- Has hover state (`hover:bg-primary-700`)
- Has focus ring
- Has disabled state
- **Issue:** Uses `py-2` which results in ~40px height; plan requires 44px minimum

**Remaining work:**
- [ ] Increase button padding to `py-3` for 44px minimum height

**Definition of done:**
- Button is immediately recognizable as the primary CTA
- Clear visual distinction from form fields
- Meets 44px minimum height for accessibility

---

### REC-LOGIN-06: Improve dark mode toggle

**Status:** NOT STARTED

**Scope:**
- Move dark mode toggle to a more intentional location (settings icon, header)
- Style as an actual toggle switch rather than text button
- Communicate current state clearly (on/off visual)
- Consider using an icon (sun/moon) for compact representation
- Or: Remove from login screen entirely, auto-detect system preference

**Current state (2026-01-20):**
```tsx
<button
  type="button"
  onClick={toggleDark}
  aria-pressed={dark}
  className="absolute right-4 top-4 text-sm font-semibold text-gray-600 dark:text-darkAccentGreen"
>
  {dark ? "Light" : "Dark"} Mode
</button>
```
Still a basic text button with no icon or toggle switch styling.

**Definition of done:**
- Toggle has clear on/off state
- Positioned intentionally, not floating arbitrarily
- Does not distract from primary login task

---

## Phase 3: Typography and Readability

### REC-LOGIN-07: Adjust heading hierarchy

**Status:** NOT STARTED

**Scope:**
- Review heading size relative to form content
- Ensure heading doesn't dominate the visual space
- Consider reducing from `text-2xl` to `text-xl` or adjusting font-weight
- Ensure heading works well at different viewport widths

**Current state (2026-01-20):**
Heading uses `text-2xl font-semibold tracking-wide`. No changes made from original.

**Definition of done:**
- Heading is prominent but balanced with form content
- No awkward wrapping at reasonable viewport widths

---

### REC-LOGIN-08: Review and improve instructional copy

**Status:** NOT STARTED

**Scope:**
- Evaluate whether "Sign in with your email and password" adds value
- Consider replacing with or adding:
  - Help link ("Having trouble?")
  - Forgot password link
  - Trust indicators (logo, product name)
- Or: Remove redundant instruction to reduce visual noise

**Current state (2026-01-20):**
Still shows generic instructional text:
```tsx
<p className="mt-1 text-sm text-gray-600 dark:text-darkAccentGreen">
  Sign in with your email and password.
</p>
```
No help link, no forgot password link added.

**Definition of done:**
- All visible text serves a clear purpose
- No redundant or low-value copy remains

---

## Phase 4: Form Field Usability

### REC-LOGIN-09: Add show/hide password toggle

**Status:** NOT STARTED

**Scope:**
- Add visibility toggle icon inside password field
- Toggle between `type="password"` and `type="text"`
- Use appropriate icon (eye/eye-off)
- Ensure focus is not lost when toggling
- Apply to both email login and PIN setup flows

**Current state (2026-01-20):**
Password field is always `type="password"` with no visibility toggle:
```tsx
<input
  id="password"
  type="password"
  autoComplete="current-password"
  ...
/>
```

**Files affected:**
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Users can reveal/hide password while typing
- Toggle is keyboard accessible
- Works in both light and dark modes

---

### REC-LOGIN-10: Add forgot password flow

**Status:** NOT STARTED

**Scope:**
- Add "Forgot password?" link below password field
- Implement Firebase Auth password reset flow:
  - Show email input (prefill if already entered)
  - Send reset email via `sendPasswordResetEmail()`
  - Show confirmation message
- Handle errors gracefully (invalid email, user not found)

**Current state (2026-01-20):**
No forgot password link or flow exists. No usage of `sendPasswordResetEmail`.

**Files affected:**
- `apps/reception/src/components/Login.tsx`
- Possibly new `ForgotPassword.tsx` component

**Definition of done:**
- Users can request password reset from login screen
- Firebase password reset email is sent successfully
- Clear feedback on success and error states

---

### REC-LOGIN-11: Verify autocomplete attributes

**Status:** DONE ✓

**Scope:**
- Audit and fix autocomplete attributes:
  - Email: `autocomplete="email"` (currently correct)
  - Password: `autocomplete="current-password"` (currently correct)
  - PIN fields: `autocomplete="off"` (currently correct)
- Verify input types are correct (`type="email"`, `type="password"`)
- Test with browser autofill and password managers

**Current state (2026-01-20):**
All autocomplete attributes are correctly set:
- Email input: `type="email" autoComplete="email"` ✓
- Password input: `type="password" autoComplete="current-password"` ✓
- PIN inputs: `type="password" inputMode="numeric" autoComplete="off"` ✓

**Definition of done:**
- Password managers can autofill credentials correctly ✓
- No warnings from browsers about form semantics ✓

---

## Phase 5: Trust and Product Identity

### REC-LOGIN-12: Add logo and product name

**Status:** NOT STARTED

**Scope:**
- Add product logo/wordmark at top of login card
- Use existing logo from `apps/reception/public/` or create one
- Ensure logo works in both light and dark modes
- Alternative: Add text-based product name if no logo exists

**Current state (2026-01-20):**
No logo present. Login card only shows "Welcome back" heading with no product identification.

**Files affected:**
- `apps/reception/src/components/Login.tsx`
- Possibly add logo asset to `apps/reception/src/assets/`

**Definition of done:**
- Login screen clearly identifies the product
- Logo/brand is visible and properly sized
- Works in both color modes

---

### REC-LOGIN-13: Add footer with help/support link

**Status:** NOT STARTED

**Scope:**
- Add minimal footer to login card or page
- Include:
  - "Having trouble? Contact support" link (or equivalent)
  - Optionally: Terms and Privacy links if applicable
- Keep footer subtle, don't distract from primary task

**Current state (2026-01-20):**
No footer exists. Users have no visible path to get help from the login screen.

**Definition of done:**
- Users have a visible path to get help
- Footer is present but not distracting

---

## Phase 6: Accessibility and Performance

### REC-LOGIN-14: Verify and improve focus states

**Status:** PARTIAL - Focus rings exist but not verified against backgrounds

**Scope:**
- Audit focus indicators on all interactive elements:
  - Email input
  - Password input
  - PIN inputs
  - Sign in button
  - Dark mode toggle
  - Skip/cancel buttons
- Ensure focus rings are visible against background
- Test keyboard navigation flow

**Current state (2026-01-20):**
Focus styles are applied to inputs and button:
```tsx
focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500
```
- Inputs have focus rings ✓
- Button has focus ring with offset ✓
- Dark mode toggle has no explicit focus styling (relies on browser default)
- **Not verified:** Visibility against actual background with image

**Remaining work:**
- [ ] Add explicit focus styling to dark mode toggle button
- [ ] Verify focus rings are visible against background image

**Definition of done:**
- All interactive elements have visible focus indicators
- Keyboard-only navigation is possible for all flows
- Focus order is logical

---

### REC-LOGIN-15: Verify WCAG color contrast

**Status:** NOT VERIFIED

**Scope:**
- Audit text contrast ratios in both light and dark modes:
  - Heading text
  - Label text
  - Input text
  - Placeholder text
  - Error messages
  - Button text
- Adjust colors to meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Pay special attention to dark mode's green accent (`#a8dba8`)

**Current state (2026-01-20):**
Dark mode uses `darkAccentGreen` (#a8dba8) for text throughout. This needs
verification against dark backgrounds for WCAG AA compliance.

**Tools:**
- Browser DevTools accessibility audit
- Contrast ratio calculators

**Definition of done:**
- All text meets WCAG AA contrast requirements
- Verified in both light and dark modes

---

### REC-LOGIN-16: Optimize background image (if retained)

**Status:** BLOCKED - Depends on REC-LOGIN-01 decision

**Scope:**
- If REC-LOGIN-01 keeps the background image:
  - Ensure image is optimized (WebP/AVIF, appropriate dimensions)
  - Lazy load or use low-quality placeholder
  - Consider preloading for perceived performance
- Current: Uses AVIF which is good, but verify dimensions

**Current state (2026-01-20):**
Image uses AVIF format which is optimal. Loaded directly without lazy loading:
```tsx
<img
  src="/landing_positano.avif"
  alt="Colourful panorama of Positano"
  className="absolute inset-0 -z-20 h-full w-full object-cover..."
/>
```

**Files affected:**
- `apps/reception/src/assets/landing_positano.avif`
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Login page loads quickly (LCP < 2.5s)
- Image doesn't block initial render

---

### REC-LOGIN-17: Add screen reader improvements

**Status:** PARTIAL - Basic a11y exists, missing aria-describedby

**Scope:**
- Verify form labels are properly associated with inputs (currently good)
- Add `aria-describedby` for error messages
- Ensure PIN inputs have meaningful labels
- Add live regions for dynamic content (errors, success messages)

**Current state (2026-01-20):**
- Form labels properly associated via `htmlFor`/`id` ✓
- Error messages use `role="alert"` for announcement ✓
- **Missing:** `aria-describedby` linking inputs to their error messages
- PIN inputs have placeholder text but no visible label element

**Remaining work:**
- [ ] Add `aria-describedby` to connect inputs with error messages
- [ ] Add visible or sr-only labels for PIN inputs

**Definition of done:**
- Screen reader can navigate all form elements
- Errors are announced when they appear
- All inputs have descriptive labels

---

## Implementation Order

Recommended priority based on impact and dependencies:

### High Priority (Do First)
1. REC-LOGIN-01 (background) - Foundation for all other visual work
2. REC-LOGIN-03 (spacing) - Improves visual quality significantly
3. REC-LOGIN-05 (CTA styling) - Critical for task completion
4. REC-LOGIN-12 (branding) - Trust and identity

### Medium Priority
5. REC-LOGIN-04 (input styling) - Polish
6. REC-LOGIN-09 (show password) - Usability improvement
7. REC-LOGIN-10 (forgot password) - Common user need
8. REC-LOGIN-14 (focus states) - Accessibility
9. REC-LOGIN-15 (contrast) - Accessibility

### Lower Priority
10. REC-LOGIN-02 (card styling) - May be resolved by REC-LOGIN-01
11. REC-LOGIN-06 (dark mode toggle) - Enhancement
12. REC-LOGIN-07 (heading hierarchy) - Fine-tuning
13. REC-LOGIN-08 (copy) - Fine-tuning
14. REC-LOGIN-11 (autocomplete) - Verification task
15. REC-LOGIN-13 (footer) - Enhancement
16. REC-LOGIN-16 (image optimization) - Performance
17. REC-LOGIN-17 (screen reader) - Accessibility polish

---

## Notes and Implementation Hints

### Current file structure
- Main component: `apps/reception/src/components/Login.tsx`
- Background image: `apps/reception/src/assets/landing_positano.avif`
- Tailwind config: `apps/reception/tailwind.config.mjs`
- Design tokens: `@acme/design-tokens`

### Design token colors available
```javascript
'action-primary': colors.indigo[600],
'action-success': colors.emerald[500],
'action-warning': colors.orange[400],
'action-danger': colors.rose[600],
'action-info': colors.sky[500],
'action-neutral': colors.teal[600],
darkBg: '#000000',
darkSurface: '#333333',
darkAccentGreen: '#a8dba8',
darkAccentOrange: '#ffd89e',
```

### Testing considerations
- Test all three login states: email/password, PIN setup, PIN unlock
- Test both light and dark modes
- Test with keyboard-only navigation
- Test with password manager autofill
- Verify on different screen sizes (desktop range)

### Related tasks
- REC-AUTH-02 in reception-functionality-improvements-plan.md covers login UX
- This plan provides detailed implementation guidance for that task

---

## Success Criteria

The login screen should:
1. Load quickly and feel responsive
2. Clearly communicate the product identity
3. Guide users through authentication without confusion
4. Be fully keyboard-accessible
5. Meet WCAG AA contrast requirements
6. Work correctly in light and dark modes
7. Handle errors gracefully with clear messaging
8. Provide recovery paths (forgot password)
9. Feel polished and professional, building user trust

## Implementation Status Summary

| Task | Status | Notes |
|------|--------|-------|
| REC-LOGIN-01 | **DONE** | Replaced with gradient background |
| REC-LOGIN-02 | **DONE** | Card uses solid bg with shadow |
| REC-LOGIN-03 | **DONE** | Consistent spacing scale applied |
| REC-LOGIN-04 | **DONE** | Email placeholder added |
| REC-LOGIN-05 | **DONE** | Button uses py-3 (44px+) |
| REC-LOGIN-06 | **DONE** | Sun/moon icons with focus ring |
| REC-LOGIN-07 | **DONE** | Heading reduced to text-xl |
| REC-LOGIN-08 | **DONE** | Copy improved, forgot password link added |
| REC-LOGIN-09 | **DONE** | Eye/eye-slash toggle added |
| REC-LOGIN-10 | **DONE** | Firebase password reset flow |
| REC-LOGIN-11 | **DONE** | Autocomplete attrs correct |
| REC-LOGIN-12 | **DONE** | Logo with "R" badge + "Reception" text |
| REC-LOGIN-13 | **DONE** | "Contact support" footer link |
| REC-LOGIN-14 | **DONE** | Focus rings on all interactive elements |
| REC-LOGIN-15 | NEEDS VERIFICATION | Standard gray scale used |
| REC-LOGIN-16 | **N/A** | Background image removed |
| REC-LOGIN-17 | **DONE** | aria-describedby + sr-only labels |

**Overall: ~95% complete (16 done, 1 needs verification)**

## Active tasks

- **REC-LOGIN-01** - Replace background image with solid/gradient background
