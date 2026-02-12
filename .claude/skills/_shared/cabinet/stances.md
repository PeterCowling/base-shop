# Cabinet Stances

Stances control what the Cabinet system looks for. A stance is not a filter — it shifts the diagnostic questions every lens asks, the patterns they notice, and what they consider "high impact."

## Invocation

```
/ideas-go-faster --stance=improve-data    # default
/ideas-go-faster --stance=grow-business
```

If no `--stance` parameter is provided, default to `improve-data`.

---

## Stance Definitions

### `improve-data` (Default)

**Focus:** Close gaps in the information foundation — measurement, plans, profiles, knowledge bases, data quality.

**Diagnostic question shift:** Every lens asks "what can't we see?" before "what should we build?"

**What "good" looks like:**
- Analytics configured and collecting data
- Business plans populated with current priorities and metrics
- People profiles reflecting actual skills, capacity, gaps
- Data gaps identified, quantified, and prioritized for investigation
- Feedback loops established (measure → learn → adjust)

**Example outputs:**
- "Configure GA_MEASUREMENT_ID for BRIK" (Measure gap)
- "Bootstrap PIPE business plan with fulfillment validation metrics" (Knowledge gap)
- "Add Search Console to BRIK" (Visibility gap)
- "Instrument booking conversion funnel" (Measurement gap)

### `grow-business`

**Focus:** Develop the business — customer acquisition, revenue growth, product launches, market expansion.

**Diagnostic question shift:** Every lens asks "what's the shortest path to revenue/growth?" before "what's missing?"

**What "good" looks like:**
- Customer acquisition channels active and measurable
- Conversion funnels optimized
- Revenue growing or launch milestones advancing
- New products/markets validated
- Competitive positioning strengthened

**Example outputs:**
- "Launch Amazon seller account for PIPE" (Revenue activation)
- "Optimize BRIK booking conversion with social proof" (Conversion improvement)
- "Build SEO landing pages for top 10 hostel search terms" (Acquisition growth)
- "Validate first PIPE product with manual fulfillment" (Market validation)

---

## Stance Boundary Rules

Not all pipeline stages respond to stance. Some must remain objective.

| Pipeline Stage | Stance Sensitivity | Behavior |
|---|---|---|
| **Composite Generation** | **SENSITIVE** | Lenses shift diagnostic questions and output focus based on stance |
| **Confidence Gate** | INVARIANT | Presentable/data-gap/hunch classification uses fixed criteria regardless of stance |
| **Cluster/Dedup** | INVARIANT | Clustering rules (same problem, same business, same JTBD) are stance-independent |
| **Munger/Buffett Filter** | INVARIANT | Evaluates truth, downside, opportunity cost. Does not care what stance wants. |
| **Card Creation** | INVARIANT | API call mechanics are stance-independent |
| **Drucker/Porter Priority** | **SENSITIVE** | Stance shifts which plan targets are weighted more heavily |
| **Fact-Find Seeding** | INVARIANT | Top K by Drucker/Porter ranking, regardless of stance |

**Why Munger/Buffett is invariant:** Their job is to kill bad ideas regardless of what the stance wants. A bad idea under `improve-data` is still a bad idea under `grow-business`. Stance shapes search direction; gatekeepers evaluate truth.

**Why Drucker/Porter is sensitive:** Stance effectively says "weight these plan targets more heavily." Under `improve-data`, measurement and infrastructure KPIs get higher weight. Under `grow-business`, revenue and acquisition KPIs get higher weight.

---

## MACRO Emphasis Mapping

Each stance shifts which MACRO categories get primary attention from generators.

### Under `improve-data`

| MACRO Category | Emphasis | Why |
|---|---|---|
| **Measure** | HIGH | Primary focus — can we see what's happening? |
| **Operate** | HIGH | Are internal processes producing usable data? |
| **Acquire** | MEDIUM | Can we measure acquisition channels? |
| **Convert** | MEDIUM | Can we measure conversion funnels? |
| **Retain** | LOW | Retention measurement is secondary to basic visibility |

### Under `grow-business`

| MACRO Category | Emphasis | Why |
|---|---|---|
| **Acquire** | HIGH | Primary focus — are customers finding us? |
| **Convert** | HIGH | Are they buying? |
| **Retain** | MEDIUM | Are they coming back? |
| **Measure** | MEDIUM | Measurement supports growth decisions |
| **Operate** | LOW | Operational efficiency is secondary to growth |

---

## Per-Lens Stance Guidance Template

Every persona file in `_shared/cabinet/` **must** include the following stance-specific sections. This template defines the required structure.

```markdown
## Stance Behavior

### Under `improve-data`

**Focus:** [What this expert looks for when stance is improve-data]

**Diagnostic questions:**
- [Question 1 — framed around data/measurement/knowledge gaps]
- [Question 2]
- [Question 3]

**Output emphasis:**
- [What kind of ideas this expert produces under this stance]

**MACRO emphasis:** [Which MACRO categories this expert prioritizes under this stance]

### Under `grow-business`

**Focus:** [What this expert looks for when stance is grow-business]

**Diagnostic questions:**
- [Question 1 — framed around revenue/growth/market]
- [Question 2]
- [Question 3]

**Output emphasis:**
- [What kind of ideas this expert produces under this stance]

**MACRO emphasis:** [Which MACRO categories this expert prioritizes under this stance]

### Stance-Invariant Rules

**Always** (regardless of stance):
- [Behavior that never changes — e.g., domain boundaries, failure modes]

**Never** (regardless of stance):
- [Anti-patterns that apply under all stances]
```

---

## Priority Formula and Stance

The priority formula does not change between stances:

```
Priority = (Impact × Confidence × Signal-Speed) / (Effort × (1 + Risk))
```

What changes is how **Impact** is assessed:
- Under `improve-data`: Ideas that close measurement/knowledge gaps score higher on Impact
- Under `grow-business`: Ideas that drive revenue/acquisition/conversion score higher on Impact

Signal-Speed (0-1) is stance-sensitive: under `improve-data`, ideas that produce measurable data quickly score higher. Under `grow-business`, ideas that produce revenue signal quickly score higher.

---

## Stance Propagation

The orchestrator propagates stance as follows:

1. **Reads `--stance` parameter** (default: `improve-data`)
2. **Passes stance to each generator lens** — lens reads its stance-specific section and adjusts diagnostic questions
3. **Confidence gate** — stance-independent (uses fixed criteria)
4. **Cluster/dedup** — stance-independent
5. **Munger/Buffett** — stance-independent (evaluates truth)
6. **Drucker/Porter** — receives stance, adjusts plan target weighting
7. **Sweep report** — records which stance was active

---

## Adding New Stances

Future stances (not in Phase 0) follow the same pattern:

1. Add stance definition to this file (focus, diagnostic shift, "good" looks like, examples)
2. Add MACRO emphasis mapping
3. Update every persona file's stance behavior section
4. Update Drucker/Porter's plan-weight mapping
5. Test with a dry-run sweep

New stances should only be added when an existing stance doesn't capture a genuinely different search direction. "Improve operations" is not a new stance — it's covered by `improve-data` (Operate category at HIGH emphasis). A new stance would be something like `reduce-risk` (focus on downside protection, compliance, stability).
