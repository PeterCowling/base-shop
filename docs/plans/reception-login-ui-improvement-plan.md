Type: Plan
Status: Active
Domain: Reception
Last-reviewed: 2026-01-13
Relates-to: reception-functionality-improvements-plan.md (REC-AUTH-02)

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

**Scope:**
- Remove the high-contrast Positano background image from login
- Replace with a clean, solid background or subtle gradient using design tokens
- Keep the image for authenticated areas if desired, but login should be clean
- Alternative: Use the image but with a much heavier scrim/overlay that ensures
  text is always legible regardless of image content

**Rationale:**
High-detail background competes with the login task. A clean background
improves focus and legibility.

**Files affected:**
- `apps/reception/src/components/Login.tsx` (LoginContainer component)

**Definition of done:**
- Login screen has consistent, predictable text legibility
- WCAG AA contrast ratios are met for all text
- Works correctly in both light and dark modes

---

### REC-LOGIN-02: Add proper form card/surface styling

**Scope:**
- Ensure the login card has consistent, visible boundaries
- Add appropriate elevation (shadow) for visual separation
- Constrain card width to a readable maximum (current max-w-md is good)
- Ensure adequate internal padding and spacing
- Add consistent border-radius from design tokens

**Current state:**
The card exists (`rounded-3xl bg-white/80 px-10 py-8 shadow-xl backdrop-blur-md`)
but may be insufficient against a complex background.

**Definition of done:**
- Card is clearly distinguishable from any background
- Internal spacing is visually balanced
- Card styling is consistent across all three login states

---

### REC-LOGIN-03: Fix vertical spacing and form rhythm

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

**Files affected:**
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Consistent visual rhythm throughout the form
- No elements appear "jammed" together
- Spacing follows a predictable scale

---

## Phase 2: Component Styling and Affordances

### REC-LOGIN-04: Improve input field styling

**Scope:**
- Reduce border weight/contrast to appropriate level
- Ensure consistent border treatment across all inputs
- Add adequate internal padding (currently `px-4 py-2`, may need `py-3`)
- Add placeholder text for email field (e.g., "name@company.com")
- Ensure cursor/text has adequate padding from input edges

**Current state:**
```tsx
className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2..."
```

**Definition of done:**
- Inputs look cohesive and intentional
- Placeholder provides guidance without being distracting
- Text insertion point has adequate padding from edges

---

### REC-LOGIN-05: Make primary CTA visually prominent

**Scope:**
- Ensure "Sign in" button is clearly the primary action
- Use filled background with adequate contrast
- Add hover and active states
- Make button taller than inputs (44px minimum for tap target)
- Add visual separation from form fields (spacing above)

**Current state:**
```tsx
className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white..."
```
This looks reasonable but need to verify `primary-600` is defined and visible.

**Definition of done:**
- Button is immediately recognizable as the primary CTA
- Clear visual distinction from form fields
- Meets 44px minimum height for accessibility

---

### REC-LOGIN-06: Improve dark mode toggle

**Scope:**
- Move dark mode toggle to a more intentional location (settings icon, header)
- Style as an actual toggle switch rather than text button
- Communicate current state clearly (on/off visual)
- Consider using an icon (sun/moon) for compact representation
- Or: Remove from login screen entirely, auto-detect system preference

**Current state:**
```tsx
<button
  onClick={toggleDark}
  aria-pressed={dark}
  className="absolute right-4 top-4 text-sm font-semibold..."
>
  {dark ? "Light" : "Dark"} Mode
</button>
```

**Definition of done:**
- Toggle has clear on/off state
- Positioned intentionally, not floating arbitrarily
- Does not distract from primary login task

---

## Phase 3: Typography and Readability

### REC-LOGIN-07: Adjust heading hierarchy

**Scope:**
- Review heading size relative to form content
- Ensure heading doesn't dominate the visual space
- Consider reducing from `text-2xl` to `text-xl` or adjusting font-weight
- Ensure heading works well at different viewport widths

**Definition of done:**
- Heading is prominent but balanced with form content
- No awkward wrapping at reasonable viewport widths

---

### REC-LOGIN-08: Review and improve instructional copy

**Scope:**
- Evaluate whether "Sign in with your email and password" adds value
- Consider replacing with or adding:
  - Help link ("Having trouble?")
  - Forgot password link
  - Trust indicators (logo, product name)
- Or: Remove redundant instruction to reduce visual noise

**Definition of done:**
- All visible text serves a clear purpose
- No redundant or low-value copy remains

---

## Phase 4: Form Field Usability

### REC-LOGIN-09: Add show/hide password toggle

**Scope:**
- Add visibility toggle icon inside password field
- Toggle between `type="password"` and `type="text"`
- Use appropriate icon (eye/eye-off)
- Ensure focus is not lost when toggling
- Apply to both email login and PIN setup flows

**Files affected:**
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Users can reveal/hide password while typing
- Toggle is keyboard accessible
- Works in both light and dark modes

---

### REC-LOGIN-10: Add forgot password flow

**Scope:**
- Add "Forgot password?" link below password field
- Implement Firebase Auth password reset flow:
  - Show email input (prefill if already entered)
  - Send reset email via `sendPasswordResetEmail()`
  - Show confirmation message
- Handle errors gracefully (invalid email, user not found)

**Files affected:**
- `apps/reception/src/components/Login.tsx`
- Possibly new `ForgotPassword.tsx` component

**Definition of done:**
- Users can request password reset from login screen
- Firebase password reset email is sent successfully
- Clear feedback on success and error states

---

### REC-LOGIN-11: Verify autocomplete attributes

**Scope:**
- Audit and fix autocomplete attributes:
  - Email: `autocomplete="email"` (currently correct)
  - Password: `autocomplete="current-password"` (currently correct)
  - PIN fields: `autocomplete="off"` (currently correct)
- Verify input types are correct (`type="email"`, `type="password"`)
- Test with browser autofill and password managers

**Definition of done:**
- Password managers can autofill credentials correctly
- No warnings from browsers about form semantics

---

## Phase 5: Trust and Product Identity

### REC-LOGIN-12: Add logo and product name

**Scope:**
- Add product logo/wordmark at top of login card
- Use existing logo from `apps/reception/public/` or create one
- Ensure logo works in both light and dark modes
- Alternative: Add text-based product name if no logo exists

**Files affected:**
- `apps/reception/src/components/Login.tsx`
- Possibly add logo asset to `apps/reception/src/assets/`

**Definition of done:**
- Login screen clearly identifies the product
- Logo/brand is visible and properly sized
- Works in both color modes

---

### REC-LOGIN-13: Add footer with help/support link

**Scope:**
- Add minimal footer to login card or page
- Include:
  - "Having trouble? Contact support" link (or equivalent)
  - Optionally: Terms and Privacy links if applicable
- Keep footer subtle, don't distract from primary task

**Definition of done:**
- Users have a visible path to get help
- Footer is present but not distracting

---

## Phase 6: Accessibility and Performance

### REC-LOGIN-14: Verify and improve focus states

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

**Current state:**
```tsx
focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500
```
This should be adequate but needs verification against actual backgrounds.

**Definition of done:**
- All interactive elements have visible focus indicators
- Keyboard-only navigation is possible for all flows
- Focus order is logical

---

### REC-LOGIN-15: Verify WCAG color contrast

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

**Tools:**
- Browser DevTools accessibility audit
- Contrast ratio calculators

**Definition of done:**
- All text meets WCAG AA contrast requirements
- Verified in both light and dark modes

---

### REC-LOGIN-16: Optimize background image (if retained)

**Scope:**
- If REC-LOGIN-01 keeps the background image:
  - Ensure image is optimized (WebP/AVIF, appropriate dimensions)
  - Lazy load or use low-quality placeholder
  - Consider preloading for perceived performance
- Current: Uses AVIF which is good, but verify dimensions

**Files affected:**
- `apps/reception/src/assets/landing_positano.avif`
- `apps/reception/src/components/Login.tsx`

**Definition of done:**
- Login page loads quickly (LCP < 2.5s)
- Image doesn't block initial render

---

### REC-LOGIN-17: Add screen reader improvements

**Scope:**
- Verify form labels are properly associated with inputs (currently good)
- Add `aria-describedby` for error messages
- Ensure PIN inputs have meaningful labels
- Add live regions for dynamic content (errors, success messages)

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
