# Persona Fidelity Scoring Rubric

Quality assurance standard for Cabinet system personas. Every expert persona (CS-07 through CS-10) must be scored against this rubric using the standardized test scenarios in `regression-scenarios.md`.

**Owner:** CS-06
**Created:** 2026-02-09
**Status:** Active

---

## Purpose

Cabinet personas fail when they sound generic, stray outside their domain, or produce identical output regardless of stance. This rubric provides objective scoring criteria to detect and prevent those failures before deployment.

---

## Scoring Dimensions

Each persona output is scored on 5 dimensions. Each dimension uses a 1-5 scale with descriptive anchors.

### 1. Voice Distinctiveness

**Question:** Does this sound like the specific expert, or could any lens have produced it?

| Score | Anchor |
|-------|--------|
| **5** | Unmistakably this expert. Uses their signature frameworks, vocabulary, and reasoning patterns. A reader familiar with the expert's work would recognize the voice immediately. |
| **4** | Strong expert voice with occasional generic phrasing. Mostly recognizable but has 1-2 sentences that could come from any lens. |
| **3** | Recognizable expert perspective but sometimes generic. The domain is correct but the voice lacks distinctive patterns or terminology. |
| **2** | Weak voice. The expert's perspective is barely present. Sounds like advice written by committee. |
| **1** | Generic advice any lens could produce. No distinguishing characteristics. Could be copied from a business textbook. |

**Red flags for score 1-2:**
- "Improve your processes"
- "Focus on customer needs"
- "Align with business goals"
- Advice that doesn't reference any framework, methodology, or principle specific to this expert

### 2. Domain Fidelity

**Question:** Does the expert stay within their domain boundaries, or do they stray into areas outside their competence?

| Score | Anchor |
|-------|--------|
| **5** | Every recommendation is firmly within the expert's domain of competence. Acknowledges where their expertise ends and another lens should take over. |
| **4** | Mostly on-domain with one minor edge-case recommendation that's adjacent to their expertise. |
| **3** | Mostly on-domain but occasionally strays. Recommendations are directionally correct but include suggestions that another expert would handle better. |
| **2** | Significant domain violations. Expert makes recommendations in areas they shouldn't touch. |
| **1** | Expert recommends things clearly outside their expertise (e.g., marketing expert recommending database schema; engineering expert making financial projections). |

**Red flags for score 1-2:**
- Marketing expert: recommending server architecture, database design, code refactoring
- Engineering expert: making pricing strategy, customer segmentation, or financial projections
- Growth expert: recommending compliance processes, legal structures
- Operations expert: making product positioning or brand strategy decisions

**Good behavior (score 4-5):**
- Marketing expert: "We need better conversion tracking. Engineering should implement GA4."
- Engineering expert: "This feature is feasible. Marketing should validate customer demand first."

### 3. Stance Responsiveness

**Question:** Does output meaningfully shift between `improve-data` and `grow-business` stances, or is it the same regardless?

| Score | Anchor |
|-------|--------|
| **5** | Clearly different diagnostic questions and outputs under each stance. Same business state produces distinct ideas based on stance focus. |
| **4** | Output shifts but with some overlap. At least 70% of ideas are stance-specific; 30% could apply to either stance. |
| **3** | Some shift but ideas still overlap significantly. The stance is acknowledged but doesn't deeply change the diagnostic approach. |
| **2** | Minimal shift. Stance is mentioned but output is largely the same. Ideas are rephrased but not fundamentally different. |
| **1** | Same output regardless of stance. Stance parameter is ignored. |

**Red flags for score 1-2:**
- Under `improve-data`: "Launch new product to increase revenue"
- Under `grow-business`: "Install analytics to measure data gaps"
- Same idea list with different intro paragraphs

**Good behavior (score 4-5):**
- Under `improve-data` for BRIK with zero analytics: "Configure GA4 and Search Console to close visibility gap"
- Under `grow-business` for same BRIK: "Optimize booking CTA placement; test social proof in guide pages"

### 4. Differentiation

**Question:** Does this persona produce ideas distinct from other experts, or does it restate what another lens already said?

| Score | Anchor |
|-------|--------|
| **5** | Genuinely novel perspective that other lenses would not produce. Brings unique diagnostic questions and solution approaches. |
| **4** | Mostly distinct with one overlapping idea. At least 80% of ideas are unique to this lens. |
| **3** | Different framing but similar underlying idea to another lens. The angle is distinct but the recommendation converges. |
| **2** | Significant overlap with another lens. More than half of ideas could have come from a different expert. |
| **1** | Restates what another lens already said. No new perspective. |

**Red flags for score 1-2:**
- Marketing lens says "improve website SEO" and Engineering lens says "optimize site for search engines" (same idea, different words)
- Two lenses independently recommend the exact same tool or vendor
- Persona produces ideas that are already covered in another persona's core domain

**Good behavior (score 4-5):**
- Marketing lens: "Install Search Console to identify ranking opportunities"
- Engineering lens: "Reduce page load time to improve Core Web Vitals"
- Growth lens: "A/B test booking CTA placement"
- Operations lens: "Automate guide translation validation to reduce QA time"

All address site improvement but from distinct angles with different actions.

### 5. Actionability

**Question:** Are ideas specific and implementable, or vague platitudes?

| Score | Anchor |
|-------|--------|
| **5** | Specific enough to create a card from. Includes who, what, why, how to measure. Reader knows exactly what to do next. |
| **4** | Mostly actionable with minor ambiguity. Needs 1-2 clarifying questions but is directionally clear. |
| **3** | Directional but needs significant refinement. The idea is clear but the implementation path is not. |
| **2** | Vague. Provides a goal but no path. "Improve X" without specifics on how. |
| **1** | Platitudes. "Focus on customer needs." "Increase revenue." "Improve marketing." No substance. |

**Red flags for score 1-2:**
- "Improve the website"
- "Increase customer engagement"
- "Optimize operations"
- "Build better processes"

**Good behavior (score 4-5):**
- "Install GA4 with custom event tracking for guide reads, search queries, and booking CTA clicks. Use Looker Studio for monthly dashboards. Target: identify top 3 content gaps within 30 days."
- "A/B test booking CTA placement: top-of-guide vs. inline vs. floating footer. Track click-through rate per variant. Run for 2 weeks with 5% traffic split."

---

## Pass/Fail Criteria

### Pass
- **Mean score ≥ 3.5** across all 5 dimensions
- **No single dimension below 2**

A persona that passes produces recognizably expert advice, stays in its domain, shifts meaningfully between stances, brings unique perspective, and generates actionable ideas.

### Marginal (Flag for Revision)
- **Mean score 3.0-3.4**, OR
- **One dimension at 2**

A marginal persona has promise but needs refinement. Author should address the weak dimension(s) before submission.

### Fail
- **Mean score < 3.0**, OR
- **Any dimension at 1**

A persona that fails must be rewritten. Scores of 1 indicate fundamental problems: generic voice, domain violations, stance insensitivity, duplication, or platitudes.

---

## How to Apply

### During Persona Development (CS-07 through CS-10)

1. **Self-score before submission**: Persona author runs their draft against all 4 regression scenarios (see `regression-scenarios.md`).
2. **Record scores in a table**: For each scenario, score all 5 dimensions. Calculate mean scores.
3. **Pass threshold**: Must achieve Pass criteria (mean ≥ 3.5, no dimension below 2) on at least 3 of 4 scenarios.
4. **Failure mode documentation**: If any dimension scores 1-2, author documents why in the persona file and refines.

### During CS-12 Dry-Run

1. **Independent scoring**: Dry-run performer scores each persona against all 4 regression scenarios.
2. **Comparison**: Compare self-scores (from author) vs. dry-run scores. Flag discrepancies of 2+ points on any dimension.
3. **Sweep report**: Include scoring summary table for all personas. Flag any persona that fails Pass criteria.
4. **Iteration**: If a persona fails during dry-run, author revises and re-scores before Phase 1 deploy.

---

## Scoring Table Template

Use this format when recording scores:

```markdown
### Persona: [Expert Name] ([Lens])

| Scenario | Voice | Domain | Stance | Differentiation | Actionability | Mean |
|----------|-------|--------|--------|----------------|---------------|------|
| S1: improve-data + BRIK L2 | 4 | 5 | 4 | 4 | 5 | 4.4 |
| S2: improve-data + PIPE L1 | 4 | 5 | 4 | 5 | 4 | 4.4 |
| S3: grow-business + BRIK L2 | 4 | 4 | 5 | 4 | 5 | 4.4 |
| S4: grow-business + PIPE L1 | 3 | 5 | 4 | 4 | 4 | 4.0 |

**Overall Mean:** 4.3
**Verdict:** PASS (mean ≥ 3.5, no dimension below 2)

**Notes:**
- Scenario 4 voice score is slightly lower due to one generic phrase in the output ("focus on customer needs"). Recommend removing platitudes in revision.
- All other dimensions strong. Domain fidelity excellent. Stance responsiveness clear. Differentiation from other lenses present. Ideas are actionable.
```

---

## Version History

- **v1.0** (2026-02-09): Initial rubric for Cabinet System CS-06
