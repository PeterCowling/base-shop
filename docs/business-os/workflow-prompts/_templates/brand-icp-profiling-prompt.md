---
Prompt-ID: BRAND-DR-02
Stage: BD-1 (Brand Dossier), BD-3 (Messaging)
Business: {{BIZ}}
As-of: {{DATE}}
Evidence-pack-target: docs/business-os/evidence/{{BIZ}}/{{YYYY-MM}}/
---

Objective:
Build an evidence-backed ICP profile for {{BIZ}} — demographics, psychographics,
jobs-to-be-done, buying triggers, language patterns.

Sources to consult (in order):
1. GA4 audience reports: age, gender, geography, device, session behavior
2. Octorate: guest nationality and booking lead-time data (if available)
3. Support/inquiry emails or messages from guests
4. Review platform text: TripAdvisor, Google Maps, Booking reviews for {{BIZ}} and 2-3 competitors
5. Reddit/travel forums: r/solotravel, r/shoestring, r/italy (or relevant) — search {{LOCATION}} + {{PRODUCT_TYPE}}
6. Instagram hashtag: {{RELEVANT_HASHTAGS}} — who is posting, what language they use

Compliance: Short extracts only. No bulk download of forum threads. Attribute every quote with
platform, URL, and date accessed. Store only what is needed to support the ICP profile.

Output format:
1. ICP Summary Table — 1-2 ICPs: demographics, psychographics, primary JTBD, buying trigger, budget sensitivity
2. Language Patterns — ≥10 phrases customers use to describe the pain this product solves
3. Delight Triggers — what makes them rate 5 stars (from review analysis)
4. Friction Points — what triggers complaints (from review analysis)
5. Purchase Decision Factors — ranked with ≥1 data point per factor
6. Channel Presence — where they discover/decide (platforms)
7. Evidence Register — source + date for every insight

Stop conditions:
- Both ICPs have all 6 ICP Summary Table fields filled with evidence
- ≥10 verbatim customer phrases captured
- Delight and friction points drawn from ≥15 reviews
- Purchase decision factors ranked with ≥1 data point per factor
