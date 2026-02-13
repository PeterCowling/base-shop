# lp-experiment

Startup experiment design and weekly readout for the S8/S10 build-measure-decide loop.

---

## Invocation

```bash
/lp-experiment design --business <BIZ>
/lp-experiment readout --business <BIZ> --experiment <name>
```

**Parameters:**
- `--business`: Business code (e.g., `BRIK`, `SEG`, `XA`)
- `--experiment`: Experiment name (readout mode only, reference to existing spec)

**Examples:**
```bash
/lp-experiment design --business NEWCO
/lp-experiment readout --business NEWCO --experiment homepage-hero-v2
```

---

## Purpose

Design falsifiable experiments (S8) and produce weekly readouts with decision recommendations (S10). Absorbs CRO funnel diagnostics as a sub-workflow. Ensures experiments have pre-committed pass/fail criteria and produce actionable learning regardless of outcome.

---

## Operating Mode

**DESIGN + MEASURE + DECIDE**

Two distinct modes:
1. **Design mode**: Create experiment specification (what to test, how to measure, pass/fail criteria)
2. **Readout mode**: Weekly results write-up with decision recommendation (continue/pivot/scale/kill)

---

## Design Mode Workflow

### Inputs
- Business context (product, audience, stage)
- Hypothesis to test (what do you believe will improve the business?)
- Available channels/surfaces (website, ads, email, etc.)
- Event taxonomy from lp-measure (what metrics can be tracked?)

### Workflow Steps

#### 1. Define Hypothesis
- State as: "[specific change] will cause [measurable outcome]"
- Must be falsifiable (can prove wrong with data)
- Example: "Adding customer logos to homepage hero will increase signup conversion rate by 15%"

#### 2. Design Variant
- What changes: specific element/copy/design change
- What stays the same: control elements (to isolate variable)
- Implementation notes: how to build/deploy the variant
- Example: Variant adds 6 customer logos below hero CTA; all other elements unchanged

#### 3. Select Metrics
- **Primary metric**: single metric that defines success (linked to lp-measure event taxonomy)
- **Secondary metrics**: 2-4 supporting metrics (guard rails, context)
- Example: Primary = `signup_conversion_rate`, Secondary = `hero_cta_click_rate`, `bounce_rate`, `time_to_signup`

#### 4. Set Sample Size or Timebox
- Minimum N (users/sessions) OR maximum T (days) to run
- Based on current traffic and expected effect size
- Example: "Run until 1,000 users see each variant OR 14 days, whichever comes first"

#### 5. Define Pass/Fail Criteria (Pre-Committed)
- **Pass**: "[primary metric] ≥ [threshold] within [timebox]"
- **Fail**: "[primary metric] < [threshold] after [timebox]"
- **Inconclusive**: sample size not reached within timebox
- Example: PASS = signup rate ≥ 3.5% (15% lift from 3.0% baseline), FAIL = signup rate < 3.5% after 14 days

#### 6. CRO Funnel Diagnostics (Optional Sub-Workflow)
- Identify which funnel stage this experiment targets
- Define upstream/downstream effects to monitor
- See CRO Funnel Diagnostics section below for detail

### Output: Experiment Spec Document

```markdown
# Experiment: [Name]

**Business:** [BIZ]
**Created:** [YYYY-MM-DD]
**Owner:** [Name]

## Hypothesis
[Specific change] will cause [measurable outcome].

## Variant Design
**Control:** [Current state]
**Variant:** [What changes]
**Implementation:** [How to build/deploy]

## Metrics
**Primary:** `[event_name]` — [definition] (source: lp-measure taxonomy)
**Secondary:**
- `[event_name]` — [definition]
- `[event_name]` — [definition]

## Sample & Timebox
**Minimum N:** [number] users per variant
**Maximum T:** [number] days
**Current traffic:** [sessions/day]

## Pass/Fail Criteria
**PASS:** `[primary_metric]` ≥ [threshold] within [timebox]
**FAIL:** `[primary_metric]` < [threshold] after [timebox]
**INCONCLUSIVE:** Sample not reached within timebox

## CRO Funnel Position (if applicable)
**Stage:** [Awareness/Interest/Desire/Action/Retention]
**Upstream metrics:** [metrics to watch before this stage]
**Downstream metrics:** [metrics to watch after this stage]

## Launch Checklist
- [ ] Variant implemented and QA'd
- [ ] Event tracking verified (test mode)
- [ ] Pass/fail criteria reviewed and agreed
- [ ] Monitoring dashboard set up
- [ ] Launch date confirmed
```

---

## Readout Mode Workflow

### Inputs
- Experiment spec (from design mode)
- Results data (observed metrics)
- Business context (any external factors that affected results)

### Workflow Steps

#### 1. Collect Results
- Extract observed values for primary + secondary metrics
- Compare control vs. variant (if A/B test)
- Note sample size achieved and time elapsed

#### 2. Evaluate Against Pass/Fail Criteria
- Apply pre-committed criteria (no post-hoc rationalization)
- Verdict: PASS / FAIL / INCONCLUSIVE

#### 3. Assess Confidence Level
- Was sample sufficient for statistical power?
- Were there external factors (seasonality, site issues, etc.)?
- Confidence: HIGH / MEDIUM / LOW with reasoning

#### 4. Generate Decision Recommendation
- **CONTINUE**: Keep running (if inconclusive and more time/traffic available)
- **PIVOT**: Test different variant (if failed but hypothesis still promising)
- **SCALE**: Roll out to 100% (if passed with high confidence)
- **KILL**: Stop and move on (if failed with high confidence)

#### 5. Propose Next Test
- What did we learn from this experiment?
- What should we test next based on this learning?
- New hypothesis to explore

### Output: Readout Document

```markdown
# Experiment Readout: [Name]

**Business:** [BIZ]
**Readout Date:** [YYYY-MM-DD]
**Experiment Spec:** [link to spec doc]

## Results
**Runtime:** [X] days ([start] to [end])
**Sample Size:** [N] users per variant (target: [M])
**Primary Metric:** `[metric_name]`
- Control: [value]
- Variant: [value]
- Lift: [+/- X%]

**Secondary Metrics:**
| Metric | Control | Variant | Lift |
|--------|---------|---------|------|
| `[metric]` | [value] | [value] | [+/- X%] |
| `[metric]` | [value] | [value] | [+/- X%] |

## Verdict
**Result:** [PASS / FAIL / INCONCLUSIVE]
**Reasoning:** [Why this verdict based on pre-committed criteria]

## Confidence Assessment
**Confidence:** [HIGH / MEDIUM / LOW]
**Reasoning:** [Sample size, external factors, data quality, consistency across secondary metrics]

## Decision Recommendation
**Decision:** [CONTINUE / PIVOT / SCALE / KILL]
**Rationale:** [Why this decision based on verdict + confidence + business context]
**Action:** [Exact next step — e.g., "Roll out variant to 100% traffic" or "Design new variant testing Y instead of X"]

## Learning
**Key Insight:** [What we learned regardless of pass/fail]
**Implications:** [How this changes our understanding of the product/market/customer]

## Next Test
**Hypothesis:** [New hypothesis based on learning]
**Why Now:** [Why this is the right next experiment]
**Link:** [Link to next experiment spec if already created]
```

---

## CRO Funnel Diagnostics (Sub-Workflow)

Use during design mode to identify where in the conversion funnel an experiment targets and what upstream/downstream effects to monitor.

### Funnel Stages
1. **Awareness**: User discovers product (traffic sources, impressions)
2. **Interest**: User explores product (page views, time on site, content engagement)
3. **Desire**: User considers purchase (add to cart, pricing page views, comparison activity)
4. **Action**: User converts (checkout start, purchase, signup)
5. **Retention**: User returns (repeat purchase, login frequency, engagement over time)

### Diagnostic Questions

**For each experiment, ask:**
- Which funnel stage does this experiment target?
- What's the current conversion rate at this stage?
- What's the leak? (Where are users dropping off?)
- What upstream metrics should we monitor? (Are we getting the right traffic to this stage?)
- What downstream metrics should we monitor? (Does improving this stage hurt later stages?)

### Example: Homepage Hero Experiment
- **Targets:** Interest stage (user arrives at homepage, decides to explore further)
- **Current conversion:** Homepage → Product page = 35%
- **Leak:** 65% bounce without clicking CTA
- **Upstream:** Traffic sources (are we getting qualified traffic?)
- **Downstream:** Product page → Signup (does new traffic convert as well?)

### When to Use
- Any experiment targeting conversion improvement
- When you need to understand context around a single metric
- When you want to identify side effects (e.g., improving interest but hurting desire)

---

## Quality Checks (Self-Audit)

### Design Mode
- [ ] Hypothesis is falsifiable (can be proven wrong with data)
- [ ] Variant design is specific (not vague like "improve UX")
- [ ] Primary metric is single, measurable, linked to lp-measure taxonomy
- [ ] Pass/fail criteria are pre-committed (numeric thresholds, not subjective)
- [ ] Sample size or timebox is realistic given current traffic
- [ ] CRO funnel position identified (if conversion experiment)

### Readout Mode
- [ ] Results collected for all metrics defined in spec
- [ ] Verdict applies pre-committed pass/fail criteria (no post-hoc rationalization)
- [ ] Confidence assessment includes sample size and external factors
- [ ] Decision recommendation is explicit (continue/pivot/scale/kill)
- [ ] Learning captured regardless of pass/fail outcome
- [ ] Next test proposed with clear hypothesis

---

## Red Flags (Invalid Output)

### Design Mode
- Vague hypothesis (e.g., "improving homepage will increase conversions")
- No pass/fail criteria or criteria are subjective (e.g., "if it looks better")
- Metrics not linked to lp-measure event taxonomy
- Sample size or timebox missing

### Readout Mode
- No explicit decision recommendation (just data dump)
- Post-hoc rationalization (changing pass/fail criteria after seeing results)
- No learning captured (especially for failed experiments)
- No next test proposed
- Confidence level missing or not justified

---

## Integration

**Upstream:**
- **lp-measure (S1B):** Provides event taxonomy for metric selection in design mode
- **lp-build (S8):** Experiments designed during build phase to test features being shipped

**Downstream:**
- **lp-prioritize (S3):** Readout decisions feed back into prioritization for next cycle
- **lp-content (S5):** Experiment learnings inform content strategy (what messaging resonates)
- **lp-channel (S4):** Channel experiments use this skill for design and readout

**Weekly Loop (S10):**
- Sunday: Review all active experiments, produce readouts
- Monday: Review readouts, make continue/pivot/scale/kill decisions
- Tuesday: Design next experiments based on learnings
