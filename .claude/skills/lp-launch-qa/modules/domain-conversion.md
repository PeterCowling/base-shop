# Domain: Conversion QA

**Goal**: Verify that revenue-generating flows work end-to-end and are instrumented for measurement.
**Required output schema**: `{ domain: "conversion", status: "pass|fail|warn", checks: [{ id: "<C1>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Checks

- **C1: Primary conversion flow submits successfully**
  - **What:** Navigate to primary conversion entry point (booking form, contact form, preorder form), fill with test data, submit
  - **Pass condition:** Form submits without errors; success state renders; no console errors
  - **Evidence:** Screenshot of success state + network log showing form POST + response status
  - **Fail condition:** Form errors, validation blocks submission, network failure, no success feedback

- **C2: Conversion analytics event fires**
  - **What:** Inspect network tab during form submission for analytics beacon (GA4 event, Plausible goal, custom event)
  - **Pass condition:** Analytics event fires with correct event name and parameters (e.g., `form_submit`, `booking_start`)
  - **Evidence:** Network request screenshot showing analytics payload with event name
  - **Fail condition:** No analytics event, wrong event name, missing required parameters

- **C3: Lead/order data reaches backend**
  - **What:** If applicable, verify form submission creates a record in CRM/database (check admin panel, logs, or API response)
  - **Pass condition:** Record appears in expected system with correct data
  - **Evidence:** Screenshot of CRM entry or log line showing record creation
  - **Fail condition:** No record created, data missing or malformed
  - **Note:** Skip if conversion is purely informational (no backend persistence)

- **C4: Error states render correctly**
  - **What:** Submit form with intentionally invalid data (missing required field, invalid email format)
  - **Pass condition:** Inline validation errors appear; form does not submit; user can correct and retry
  - **Evidence:** Screenshot of validation error UI
  - **Fail condition:** Form submits with invalid data, no error feedback, confusing error messages

- **C5: Checkout flow completeness (if applicable)**
  - **What:** For e-commerce/booking sites, walk through full checkout (add to cart → checkout → payment screen)
  - **Pass condition:** All steps render; payment gateway loads (do not complete payment); cart state persists across steps
  - **Evidence:** Screenshot of each checkout step including payment screen
  - **Fail condition:** Broken step, cart resets, payment gateway fails to load
  - **Note:** Skip if site has no checkout flow

## Domain Pass Criteria

All applicable checks pass. One failure blocks launch.
