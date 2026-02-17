## Per-business action cards

These cards tell you exactly what to do for each business. Each step is actionable — no code knowledge or repository access required.

### HEAD card

**Title:** Confirm HEAD operations

**Why it matters:** The HEAD 90-day forecast cannot become decision-grade until six operational inputs are confirmed. Without them, any planning and investment decision rests on assumptions.

1. Confirm the in-stock date — when will the product physically be available to ship?
2. Confirm sellable units — how many units are available at launch?
3. Confirm pricing and any bundle options.
4. Provide the compatibility matrix — which devices/platforms does the product work with?
5. Confirm the payment flow is ready to accept orders.
6. Define the returns policy and SLA (how long does a return take?).

**Done when:** All six fields are filled in and timestamped. The Operational Confirmations form shows complete status.

---

### PET card

**Title:** Confirm PET supply and run first acquisition test

**Why it matters:** The PET forecast is not decision-grade without real inventory data and at least one measured acquisition data point. Seed assumptions are not enough to make a confident investment decision.

1. Confirm inventory units — how many units are on hand or on order?
2. Confirm the expected arrival date for the inventory.
3. Confirm the landed cost per unit (total cost including shipping, duties, and fees).
4. Run a small paid acquisition test for 7 days (any channel — Meta, Google, TikTok).
5. Record the observed cost per click (CPC) and conversion rate (CVR) from the test.

**Done when:** All inventory inputs confirmed. First measured CPC and CVR captured. Forecast document updated to decision-grade.

---

### BRIK card

**Title:** Restore GA4 measurement signal

**Why it matters:** The weekly BRIK decision loop depends on non-zero signal from two GA4 events (begin_checkout and web_vitals) in standard 7-day reports. If these show zero, the weekly cadence cannot produce reliable data.

1. Open Google Analytics 4 → go to Standard Reports (NOT the Realtime section).
2. Navigate to Engagement → Events.
3. Set the date range to the last 7 days.
4. Check whether begin_checkout shows a non-zero count.
5. Check whether web_vitals shows a non-zero count.
6. If either is zero: open GA4 DebugView, open a live browser session on the site, and check whether the events fire during a real checkout attempt.
7. Document your findings — what you saw and whether it resolved.

**Done when:** Non-zero begin_checkout and web_vitals confirmed in standard 7-day GA4 report. Document saved. Then proceed to the day-14 forecast recalibration.
