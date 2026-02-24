---
Type: Task-Artifact
---

# TASK-20 — Backlink Target Vetting + Contactability Matrix

Date: 2026-02-23  
Task: `TASK-20` (`INVESTIGATE`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Execution Status

Status: **Complete**

`TASK-18` exports were normalized into a full domain matrix, then augmented with public web checks (topic relevance, freshness, contactability) to produce a send-ready outreach shortlist.

## Inputs Used

- `docs/plans/brikette-seo-traffic-growth/task-18-gsc-links-baseline.md`
- `docs/plans/brikette-seo-traffic-growth/artifacts/task-18-links-export/task-18-top-linking-sites-2026-02-23.csv`
- Public evidence checks (sitemaps, article URLs, contact/about pages), executed 2026-02-23.

## Qualification Rubric

Columns used for qualification:
- `editorial_relevance`: travel/editorial relevance to Positano/Amalfi
- `topic_recency`: Positano/Amalfi content published/updated within last 12 months where verifiable
- `contactability`: reachable contact form/email/editorial route
- `class`: `warm` (existing relevant referrer), `cold` (possible target), `exclude` (non-editorial/irrelevant/low-value)

## Exported Linking Domains Matrix (All 33)

| Domain | Class | Rationale | Contactability | Decision |
|---|---|---|---|---|
| `yohomobile.com` | exclude | Utility/referral pattern, not travel editorial | not pursued | Exclude |
| `paginebianche.it` | exclude | Directory/listing site | not pursued | Exclude |
| `wanderlog.com` | warm | Strong travel intent; existing links; Positano/Amalfi coverage | `https://wanderlog.com/page/contact` (200) | Keep |
| `skylarsrl.com` | exclude | Business/corporate source, low editorial fit | not pursued | Exclude |
| `yoys.it` | exclude | Directory-style domain | not pursued | Exclude |
| `worldbesthostels.com` | cold | Hostel-focused but contactability/recent-topic proof weak | no confirmed 200 contact route | Hold |
| `oltreleparoleblog.com` | cold | Blog-like domain but evidence thin | not confirmed | Hold |
| `wikitravel.org` | cold | Travel wiki; weak editorial outreach channel | `/en/Contact_Wikitravel` exists but not ideal for PR outreach | Hold |
| `theculturetrip.com` | cold | Editorially relevant; anti-bot/route checks unstable in this run | contact route not confirmed with 200 in this run | Hold |
| `cruisenonstop.com` | cold | Travel-adjacent but weak Positano/Amalfi freshness evidence | not confirmed | Hold |
| `dailyhive.com` | cold | Editorial site; topical relevance to Positano not strongly evidenced | `https://dailyhive.com/page/contact` (200) | Hold |
| `elle.be` | cold | Lifestyle editorial, low direct hostel-fit | no confirmed 200 contact route in run | Hold |
| `expatoftheworld.com` | exclude | Unreachable in run; no reliable evidence collected | not confirmed | Exclude |
| `infohostels.com` | exclude | Directory/aggregator style | not pursued | Exclude |
| `italianfix.com` | warm | Existing referrer + active Amalfi/Positano coverage | `https://www.italianfix.com/contact/` (200) | Keep |
| `justdog.it` | exclude | Topically irrelevant | not pursued | Exclude |
| `katierobynmorgan.com` | exclude | Stale archive; not current Amalfi editorial target | no current-fit contact strategy | Exclude |
| `lonelyplanet.de` | cold | Strong editorial brand but contactability blocked in run | contact route blocked/unverified | Hold |
| `naver.com` | exclude | Platform/portal, not direct editorial target | not pursued | Exclude |
| `nextdoor.com` | exclude | Community platform, not editorial outreach target | not pursued | Exclude |
| `oneplanetnetwork.org` | exclude | Non-target org context | not pursued | Exclude |
| `paginegialle.it` | exclude | Directory/listing site | not pursued | Exclude |
| `pixelboutique.it` | exclude | Non-editorial/non-travel fit | not pursued | Exclude |
| `portanapoli.de` | warm | Existing referrer + Amalfi/Positano topical pages with recent updates | `https://www.portanapoli.de/contact` (200) | Keep |
| `postcard.inc` | exclude | Low fit/unclear editorial channel | not pursued | Exclude |
| `substack.com` | exclude | Platform domain (not target publication itself) | not pursued | Exclude |
| `thetravelingtwin.com` | warm | Existing referrer + active Amalfi/Positano content | `https://www.thetravelingtwin.com/contact` (200) | Keep |
| `travelwithnat.co` | cold | Active site but Amalfi/Positano proof weak in this run | `https://travelwithnat.co/contact` (200) | Hold |
| `virgilio.it` | exclude | Portal/listing style | not pursued | Exclude |
| `vivodeviajes.com` | cold | Good Amalfi topicality; direct form/email route not verified | about/profile route found; no direct contact form verified | Hold |
| `wordpress.com` | exclude | Platform domain | not pursued | Exclude |
| `localitybiz.it` | exclude | Directory/listing style | not pursued | Exclude |
| `lonelyplanet.com` | cold | Strong editorial brand but contactability blocked in run | contact route blocked/unverified | Hold |

## Send-Ready Shortlist (Top 10)

Ranking uses: relevance to Positano/Amalfi + freshness + contactability + likely editorial acceptance.

| Rank | Domain | Warm/Cold | Topic Evidence | Freshness Evidence | Contact Route | Personalization Angle |
|---:|---|---|---|---|---|---|
| 1 | `italianfix.com` | warm | `https://www.italianfix.com/amalfi-coast-matera-puglia/` | sitemap lastmod `2026-01-19` | `https://www.italianfix.com/contact/` | Existing referrer; pitch a practical Positano hostel budget-data update |
| 2 | `thetravelingtwin.com` | warm | `https://www.thetravelingtwin.com/destinations/italy/everything-you-need-to-know-about-the-amalfi-coasts-new-airport` | sitemap lastmod `2025-12-29` | `https://www.thetravelingtwin.com/contact` | Airport-transfer + arrival logistics angle from hostel ops perspective |
| 3 | `portanapoli.de` | warm | `https://www.portanapoli.de/amalfikueste/highlights` | sitemap lastmod `2025-07-09` | `https://www.portanapoli.de/contact` | German-language Amalfi audience; offer up-to-date hostel arrival tips |
| 4 | `wanderlog.com` | warm | `https://wanderlog.com/tp/10018/positano-trip-planner` | page-extracted 2025 date signals | `https://wanderlog.com/page/contact` | Data-backed local additions (budget, transit friction, peak-time advice) |
| 5 | `travelandleisure.com` | cold | `https://www.travelandleisure.com/best-amalfi-coast-towns-11749757` | page published date `2025-06-21` | `https://travelandleisure.com/contact` | Contribute local-budget/hostel perspective missing from luxury-heavy coverage |
| 6 | `fodors.com` | cold | `https://www.fodors.com/world/europe/italy/amalfi-coast/experiences/news/photos/which-towns-in-amalfi-coast-should-i-visit` | sitemap lastmod `2025-05-20` | `https://fodors.com/contact-us` | Town-comparison update with real on-the-ground cost/logistics context |
| 7 | `earthtrekkers.com` | cold | `https://www.earthtrekkers.com/rome-to-sorrento-capri-amalfi-coast/` | sitemap lastmod `2025-11-05` | `https://www.earthtrekkers.com/contact/` | Offer accuracy update for Rome->Positano budget route details |
| 8 | `zestinatote.com` | cold | `https://zestinatote.com/amalfi-coast-itinerary-4-days/` | sitemap lastmod `2025-05-03` | `https://zestinatote.com/contact` | Share hostel-centric 4-day itinerary refinements for budget travelers |
| 9 | `cityorcity.com` | cold | `https://cityorcity.com/new-orient-express-paris-amalfi-coast/` | sitemap lastmod `2026-01-11` | `https://cityorcity.com/contact` | Offer local Positano extension tips and practical stay options |
| 10 | `touristjourney.com` | cold | `https://touristjourney.com/tours/rome-vatican-city-amalfi-5-day-tour-package/` | sitemap lastmod `2026-01-08` | `https://touristjourney.com/contact` | Convert high-intent package audience with practical Positano hostel extension angle |

## Explicit Exclusion Set (From Exported Domains)

Primary `exclude` buckets to avoid spending outreach effort:
- Platform/portal/directory: `paginebianche.it`, `paginegialle.it`, `yoys.it`, `localitybiz.it`, `wordpress.com`, `substack.com`, `naver.com`, `nextdoor.com`, `virgilio.it`
- Irrelevant/low-fit sources: `justdog.it`, `oneplanetnetwork.org`, `pixelboutique.it`, `postcard.inc`, `skylarsrl.com`
- Evidence-unusable in this run: `expatoftheworld.com`

## Reviewer Spot-Check Sample (5 rows)

Rows spot-checked against source pages:
- `italianfix.com` (topic URL + sitemap lastmod + contact route)
- `thetravelingtwin.com` (topic URL + sitemap lastmod + contact route)
- `portanapoli.de` (topic URL + sitemap lastmod + contact route)
- `travelandleisure.com` (topic URL + published date + contact route)
- `zestinatote.com` (topic URL + sitemap lastmod + contact route)

Result: classification and send-readiness logic matches evidence captured.

## Decision Output

**At least 10 send-ready outreach targets identified and ranked.**

Additional outcome:
- Exported-domain matrix confirms a large low-value directory/platform tail; warm execution should focus on high-fit editorial domains first.
- `TASK-21` can now build final warm/cold templates and 10 personalized drafts directly from this shortlist.

## Acceptance Check

- Domain matrix includes all exported linking domains with class + rationale: **Pass**
- At least 10 send-ready targets with recency + contact route evidence: **Pass**
- Exclusion list for low-value/non-editorial domains documented: **Pass**
- Top-10 ranked shortlist with personalization angles: **Pass**
