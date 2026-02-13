---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: Platform
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: advanced-math-algorithms
Business-Unit: PLAT
---

# Advanced Mathematics & Algorithms Upgrade — Fact-Find Brief

> **Reading guide:** Each statement is labeled:
>
> - **[FACT]** — Observable truth about the current system, with evidence
> - **[ASSUMPTION]** — Belief not yet verified; may be wrong
> - **[PROPOSAL]** — Design decision for discussion
> - **[EXTERNAL]** — Technique sourced from external research (Dicklesworthstone / Jeffrey Emanuel repos)

## Scope

### Summary

Audit the existing mathematical and algorithmic capabilities in base-shop, identify gaps and under-utilisation, and catalogue external techniques (primarily from [Dicklesworthstone](https://github.com/Dicklesworthstone)) that could raise the sophistication of search, pricing, analytics, recommendations, and operational tooling across the platform.

Reframe for this revision: this is now startup-loop-first, not math-first. The core question is what will help us build fast-growing businesses faster. Math is one enabler, but not the whole operating system.

### Goals

1. Understand what we already have and how deeply it is integrated
2. Identify high-value gaps where better math would move business metrics
3. Catalogue specific external techniques with realistic integration paths
4. Identify startup-loop growth capabilities that are currently missing or weak, even when they are not strictly "math modules"
5. Produce a prioritised opportunity list ready for `/lp-plan`

### Compatibility Constraint (Hard Gate)

**[FACT]** For this workstream, proposals must be implementable inside the current TypeScript monorepo/runtime.

**Non-negotiables:**
1. No Rust dependencies in production execution paths.
2. No Python sidecars/microservices.
3. No sidecar architecture for algorithms/search.
4. If a capability is not feasible under the current repo stack, mark it dropped (or inspiration-only), not proposed for implementation.

---

## 1. Current State — What We Have

### 1.1 Core Math Library (`packages/lib/src/math/`)

**[FACT]** The monorepo currently contains ~10,981 lines of purpose-built mathematical code in 10 exported modules under `packages/lib/src/math/`.

| Module | Key Algorithms | Sophistication | Active Usage |
|--------|---------------|----------------|--------------|
| **statistics/** | Mean, median, percentiles (R-7), skewness, kurtosis, Pearson r, Spearman ρ | High | Analytics dashboards |
| **probabilistic/** | HyperLogLog++, t-Digest, Bloom Filter, Count-Min Sketch w/ EWMA decay | Very High | Unique visitors, latency percentiles, trending content, rate-limit pre-checks |
| **search/** | BM25 (field boosting, Porter stemming), Levenshtein / Damerau-Levenshtein, BK-Tree, n-gram Jaccard | Very High | Product search, guide search, typo tolerance |
| **forecasting/** | EWMA, Simple Exponential Smoothing, Holt's Linear | Medium-High | Anomaly baselines, demand trend |
| **financial/** | Markup/margin, compound interest, amortisation, banker's rounding | Medium-High | Pricing engine |
| **random/** | Seeded PRNG (xoshiro128**), weighted sampling, reservoir sampling | Medium-High | Deterministic simulation and sampling primitives |
| **geometry/** | 3×3 affine matrices, 2D vector ops | Medium | Canvas/SVG transforms |
| **animation/** | Cubic Bézier (Newton-Raphson), spring physics (damped harmonic oscillator) | High | UI transitions |
| **color/** | OKLCH ↔ sRGB, ΔE perceptual distance, WCAG contrast, gamut mapping (binary search) | Very High | Design tokens, accessibility |
| **rate-limit/** | Token bucket | Medium | API throttling |

**[FACT]** The probabilistic data structures (HyperLogLog, t-Digest, Count-Min Sketch) are research-quality implementations that rival standalone libraries. The OKLCH color module implements cutting-edge perceptual color science (Björn Ottosson, 2020).

### 1.2 Applied Usage in Apps

| Location | What It Does | Math Involved |
|----------|-------------|---------------|
| `apps/brikette/src/lib/analytics/trending.ts` | Trending guides/searches | Count-Min Sketch + time decay |
| `mcp-server/src/utils/template-ranker.ts` | Auto-select email templates | BM25 + synonym expansion + confidence scoring |
| `apps/prime/src/lib/owner/kpiAggregator.ts` | Daily KPI rollup | Weighted readiness score, median lag |
| `apps/prime/src/lib/owner/businessScorecard.ts` | Business health dashboard | Gap analysis, impact categorisation |
| `apps/brikette/src/routes/how-to-get-here/pickBestLink.ts` | Route recommendation | Multi-criteria scoring with transfer/time penalties |
| `packages/platform-core/src/pricing/` | Rental pricing | Duration discount tiers, currency conversion |

### 1.3 Gaps — What We Don't Have

**[FACT]** The following categories do not currently have dedicated end-to-end modules/workflows in the codebase (some low-level primitives exist, but no complete production contracts):

| Gap | Business Impact |
|-----|----------------|
| **Recommendation engine** | No "related products", no collaborative/content-based filtering |
| **Experimentation decision science** | No sample-size calc, no significance testing suite, no multi-armed bandit policy |
| **Clustering / segmentation** | No k-means, DBSCAN, or any customer grouping |
| **Optimisation algorithms** | No LP, evolutionary, or constraint-satisfaction solvers |
| **Graph algorithms** | No PageRank, shortest-path, community detection |
| **Seasonal forecasting** | Holt-Winters, ARIMA, or any seasonal decomposition missing |
| **Anomaly detection** | No isolation forest, no z-score alerting pipeline |
| **Hypothesis testing** | No t-test, chi-square, or confidence intervals |
| **Semantic / vector search** | No embeddings pipeline, no TypeScript-native ANN retrieval layer, no cosine similarity search contract |

---

## 2. External Research — Dicklesworthstone (Jeffrey Emanuel)

Jeffrey Emanuel maintains 90+ open-source projects (16,700+ stars). Here they are used as idea references only; implementation proposals below remain constrained to TypeScript/in-repo compatibility.

### 2.1 Similarity & Dependency Metrics

**[EXTERNAL]** **fast_vector_similarity** — Rust library (with Python bindings) providing 6 production-grade similarity measures:

| Metric | What It Detects | Why It Matters |
|--------|----------------|----------------|
| Spearman ρ | Monotonic relationships | Ranking correlation between user preferences |
| Kendall τ | Concordance of rankings | O(n log n) inversion-counting; robust to outliers |
| Approx. Distance Correlation | Linear + non-linear dependency | Detects relationships Pearson misses entirely |
| Jensen-Shannon Dependency | Information-theoretic divergence | Quantifies how much knowing X tells you about Y |
| Hoeffding's D | Arbitrary (non-monotonic) dependency | Catches ring-shaped, X-shaped, and other exotic dependencies |
| Normalised Mutual Information | Categorical + continuous | Cross-type variable relationships |

**[EXTERNAL]** **hoeffdings_d_explainer** — Educational repo with 75-line NumPy implementation. Hoeffding's D examines all quadruple combinations of data points, comparing observed joint rank distributions against independence expectations. Range: −0.5 to 1.0. Unlike Pearson (linear-only) or Spearman/Kendall (monotonic-only), it detects complex non-functional patterns.

**[ASSUMPTION]** Applying Hoeffding's D to booking + browsing data would surface non-obvious behavioural patterns (e.g., users with moderate session duration + specific page sequences = highest conversion) that our current Pearson-only analytics miss.

### 2.2 Search & Retrieval

**[EXTERNAL]** **swiss_army_llama** — semantic search service showing a two-stage retrieval pattern: embeddings -> ANN shortlist -> refined re-ranking.

The **two-stage search** architecture is the key takeaway:
1. **Stage 1 — ANN shortlist** rapidly narrows to top-K candidates by cosine similarity
2. **Stage 2 — Re-rank** with Hoeffding's D, distance correlation, or domain-specific scorers

**[FACT]** Our BM25 search is lexical only. Adding a semantic layer would enable natural-language queries like "cozy apartment near the beach with good natural light" that BM25 cannot handle well.

### 2.3 Non-Gradient Optimisation

**[EXTERNAL]** **CMA-ES** is a useful reference pattern for non-gradient optimization in difficult objective landscapes.

Applicable to:
- **Dynamic pricing**: optimise price points against non-smooth demand curves
- **Marketing budget allocation**: optimise spend across channels with non-linear ROI
- **Resource scheduling**: staff and inventory placement with discrete constraints

**[PROPOSAL]** Under current constraints, do **not** propose Rust CMA-ES integration. Prefer TypeScript-native alternatives (simulated annealing / coordinate search / random-restart hill climbing) or drop.

### 2.4 Exotic ML Attention Mechanisms

**[EXTERNAL]** **model_guided_research** contains novel attention ideas; however, its primary implementations are in JAX/PyTorch and are not directly stack-compatible.

| Framework | Core Idea | Potential Use |
|-----------|-----------|---------------|
| **Tropical Geometry Attention** | Max-plus algebra → piecewise-linear, interpretable, 1-Lipschitz robust | Explainable pricing models, fraud detection with provable margins |
| **Ultrametric (p-adic) Attention** | Hierarchical tree-distance metric → O(N log N) attention | Efficient processing of product taxonomies |
| **Simplicial Complexes** | k-way interactions beyond pairwise | Model user × product × season interactions for recommendations |
| **Reversible Computation** | Invertible transforms → O(1) memory training | Train large recommendation models under memory constraints |

**[PROPOSAL]** Mark these as inspiration-only for now. Do not include in implementation roadmap unless a TypeScript-native approach is defined.

### 2.5 Agent & Developer Tooling

**[EXTERNAL]** Lower priority for math integration but worth noting:

- **beads_viewer** — PageRank + critical-path analysis for task DAGs. Could enrich Business OS card prioritisation with graph centrality metrics.
- **llm_aided_ocr** — Tesseract + LLM correction pipeline. Useful if we process guest documents (passports, IDs, rental agreements).
- **coding_agent_session_search** — Index + search agent session history. Could improve our multi-agent coordination.

---

## 3. Opportunity Analysis

### 3.1 High-Value Opportunities (move business metrics directly)

#### Opportunity A: Recommendation Engine

**[FACT]** No recommendation system exists. For an e-commerce/rental platform, "related items" and "guests who booked X also booked Y" are table-stakes features.

**[PROPOSAL]** Three-tier approach:
1. **Content-based** (immediate): TF-IDF or BM25 similarity between product descriptions — we already have BM25
2. **Collaborative filtering** (short-term): Item-item co-occurrence from booking history
3. **Hybrid + advanced metrics** (medium-term): Embed products, use fast_vector_similarity metrics for re-ranking

**Integration surface**: `packages/lib/src/math/` new `recommendations/` module. Consumed by brikette (guide/experience recommendations) and prime (property cross-sell).

#### Opportunity B: Semantic Vector Search

**[FACT]** Current search is lexical-only (BM25). Semantic search would handle intent-based queries and cross-language matching.

**[PROPOSAL]** Architecture following swiss_army_llama's two-stage pattern:
1. Generate embeddings at build/ingest time (OpenAI `text-embedding-3-small` or local model)
2. TypeScript-compatible ANN retrieval (in-process library or precomputed index format consumable by Node runtime)
3. Re-rank with BM25 + semantic score fusion (reciprocal rank fusion)

**[ASSUMPTION]** We can run embedding generation as a build step and ship a static TS-consumable index, avoiding query-side heavy compute.

#### Opportunity C: A/B Testing & Experimentation Framework

**[FACT]** No statistical testing framework exists. Pricing changes, UI experiments, and marketing campaigns currently lack rigour.

**[PROPOSAL]** New `packages/lib/src/math/experimentation/` module:
- Sample size calculator (given baseline rate, MDE, power)
- Frequentist: z-test, t-test, chi-square, confidence intervals
- Bayesian: Beta-Binomial model for conversion rates, Thompson sampling for multi-armed bandit
- Sequential testing (group sequential / always-valid p-values) for early stopping

This unblocks data-driven pricing experiments in platform-core.

#### Opportunity D: Enhanced Forecasting (Seasonal)

**[FACT]** Current forecasting stops at Holt's Linear — no seasonal component. Rental/tourism businesses have strong seasonality.

**[PROPOSAL]** Add to `packages/lib/src/math/forecasting/`:
- Holt-Winters (additive + multiplicative seasonal)
- Seasonal decomposition (STL)
- Forecast confidence intervals (prediction intervals)
- Model selection via AIC/BIC

**Integration surface**: prime KPI dashboards, brikette analytics, demand forecasting for pricing.

### 3.2 Medium-Value Opportunities (operational improvement)

#### Opportunity E: Anomaly Detection Pipeline

**[PROPOSAL]** Combine existing EWMA with:
- Z-score alerting (>3σ from rolling baseline)
- Isolation Forest (tree-based, handles multivariate)
- Changepoint detection (CUSUM or Bayesian online changepoint)

Use cases: booking volume anomalies, revenue drops, traffic spikes, check-in lag outliers.

#### Opportunity F: Customer Segmentation via Clustering

**[PROPOSAL]** New `clustering/` module:
- K-means with elbow method / silhouette scoring
- DBSCAN for density-based clustering (handles noise)

**[ASSUMPTION]** Even basic k-means on booking frequency × average spend × lead time would produce actionable guest segments for targeted marketing.

#### Opportunity G: Graph Algorithms for Business OS

**[PROPOSAL]** Port PageRank and betweenness centrality (inspired by beads_viewer) into Business OS card ranking:
- Cards that block many downstream cards bubble up
- Critical-path highlighting shows longest dependency chain to a milestone
- Eigenvector centrality identifies "connectors" in the idea graph

#### Opportunity H: Non-Gradient Pricing Optimisation (TypeScript-Only)

**[PROPOSAL]** Use TypeScript-native non-gradient optimizers to optimise:
- Duration discount tier boundaries (currently hand-tuned)
- Seasonal pricing multipliers
- Channel-specific pricing

Candidate methods: simulated annealing, coordinate descent, random-restart hill climbing.

**[ASSUMPTION]** Requires sufficient booking history data to construct a meaningful objective function. Minimum ~500 bookings per property to train on.

### 3.3 Research / Future Opportunities (high effort, uncertain payoff)

#### Opportunity I: Tropical Geometry for Interpretable Pricing

**[EXTERNAL]** Piecewise-linear models from tropical geometry give provably bounded outputs and human-readable decision rules. Could replace opaque ML models in pricing decisions where regulatory transparency matters.

**Disposition**: Dropped under current compatibility constraints (requires non-TypeScript ML stack unless fully reimplemented).

#### Opportunity J: Ultrametric Attention for Taxonomy

**[EXTERNAL]** p-adic distance-based attention for hierarchical product catalogs. O(N log N) vs O(N²) for standard attention. Only relevant if we build ML-based catalog understanding.

**Disposition**: Dropped under current compatibility constraints (research-grade and non-TypeScript stack dependency).

#### Opportunity K: Advanced Similarity Metrics Library

**[EXTERNAL]** Port Hoeffding's D, distance correlation, and Jensen-Shannon dependency from fast_vector_similarity to TypeScript for the math library.

**[PROPOSAL]** Reasonable scope — these are well-defined mathematical formulas. A TypeScript port of Hoeffding's D is ~100 lines. Would enrich our correlation analytics beyond Pearson/Spearman.

### 3.4 Startup-Loop Growth Gaps Not Covered in the Current Proposal Set

The list above improves analysis quality, but it still under-targets growth-loop throughput. The startup loop needs explicit capabilities for compounding learning and allocating capital faster.

#### Opportunity L: Experiment-to-Baseline Learning Compiler (`S10 -> S2B/S3/S6B`)

**[FACT]** The loop has weekly experiments/readouts, but no explicit canonical mechanism that writes experiment learnings back into offer/channel/forecast priors as first-class baseline artifacts.

**[PROPOSAL]** Add a control-plane step that ingests experiment outcomes, updates priors with confidence deltas, and records accepted/rejected hypotheses in baseline state.

#### Opportunity M: Growth Accounting Kernel (North-Star Tree + Guardrails)

**[FACT]** CAC/CVR/AOV-style metrics appear across multiple docs/skills, but there is no single canonical growth accounting artifact enforced at runtime as a decision gate.

**[PROPOSAL]** Define a per-business growth ledger (`acquisition -> activation -> revenue -> retention -> referral`) with strict scale/hold/kill guardrails and stage-level pass/fail thresholds.

#### Opportunity N: Hypothesis Portfolio Manager (Expected-Value Ranking)

**[FACT]** Current flow can prioritize go-items, but there is no explicit portfolio optimizer that ranks experiments by expected value, time-to-signal, and downside.

**[PROPOSAL]** Introduce a hypothesis registry where every bet has: prior confidence, upside estimate, detection window, required spend, dependencies, and stopping rule.

#### Opportunity O: Variant Factory for Creative + Landing + Offer Tests

**[FACT]** We can generate assets, but we do not have a startup-loop contract that links hypothesis -> variant generation -> channel deployment -> measurement tags -> readout.

**[PROPOSAL]** Build a variant pipeline that auto-generates controlled variants (copy, creative, page, pricing frame), assigns experiment IDs, and enforces tracking completeness before launch.

#### Opportunity P: Channel Budget Allocator (Weekly Reallocation Engine)

**[ASSUMPTION]** Channel decisions are still largely operator-driven and manual in most runs.

**[PROPOSAL]** Add a policy layer (initially rules-based, then bandit/Bayesian) that reallocates spend weekly toward channels with best posterior contribution and lowest risk.

#### Opportunity Q: Customer Signal Ingestion (Qual + Quant Merge)

**[ASSUMPTION]** Customer objections, sales-call transcripts, support threads, and booking conversations are not yet normalized into one structured signal feed for offer updates.

**[PROPOSAL]** Create an ingestion + tagging contract so qualitative signals become machine-usable artifacts feeding offer positioning, objections handling, and channel messaging.

#### Opportunity R: Bottleneck Locator + Auto-Replan Trigger

**[FACT]** The startup loop has stages and QA gates, but no dedicated "constraint detector" that continuously identifies the highest-leverage bottleneck in the growth funnel.

**[PROPOSAL]** Add a weekly bottleneck diagnosis artifact and auto-trigger `/lp-replan` when the same root cause persists across N runs.

#### Opportunity S: ICP/Offer Drift Detection

**[ASSUMPTION]** ICP and positioning can drift as markets react, but we do not yet run a formal drift detector against new evidence.

**[PROPOSAL]** Add periodic drift checks that compare new customer evidence to current ICP/offer hypotheses and force explicit keep/update decisions.

#### Opportunity T: Distribution Compounding Engine (Referral/Partnership Loops)

**[ASSUMPTION]** Current loop emphasizes channel selection and experiments but may underweight durable compounding loops (referrals, partnerships, UGC flywheels).

**[PROPOSAL]** Add a dedicated compounding-loop workstream with explicit loop mechanics, trigger thresholds, and anti-fraud guardrails.

### 3.5 Speculative "Go Shopping" Backlog (Uncertain, High-Upside)

These are intentionally early and partially-formed. Keep them as inspiration targets for TS-compatible exploration and spikes.

| Candidate Capability | Why It Might Matter for Fast Growth | Confidence |
|---|---|---|
| **Causal impact engine (not just correlation)** | Prevents scaling channels/experiments that look good but are confounded | Low-Medium |
| **Autonomous media buying copilot** | Could materially cut cycle time from insight -> spend shift | Low |
| **Competitor offer-change radar** | Faster response to competitor pricing/positioning changes | Low-Medium |
| **Synthetic customer simulator for pre-launch tests** | Could de-risk early bets before expensive acquisition spend | Low |
| **Growth-memory graph across businesses** | Reuse validated playbooks across BRIK/PET/PIPE instead of relearning from scratch | Medium |
| **Dynamic packaging/offer bundling optimizer** | Potentially large AOV and conversion lift | Low-Medium |
| **Automated objection-intelligence from inbound conversations** | Speeds copy/offer iteration with real language from customers | Medium |
| **Portfolio risk governor (capital at risk per week)** | Prevents over-concentration in one fragile growth bet | Medium |

---

## 4. Integration Architecture

**[FACT]** Our math library is already well-structured as pure functions in `packages/lib/src/math/`. New capabilities should follow the same pattern.

```
packages/lib/src/math/
├── statistics/          # existing — extend with hypothesis testing, CI
├── probabilistic/       # existing — complete
├── search/              # existing — add semantic/vector layer
├── forecasting/         # existing — add Holt-Winters, STL, AIC
├── financial/           # existing — connect to optimisation
├── random/              # existing — seeded PRNG/sampling primitives
├── geometry/            # existing
├── animation/           # existing
├── color/               # existing
├── rate-limit/          # existing
├── recommendations/     # NEW — content-based, collaborative, hybrid
├── experimentation/     # NEW — sample size, significance, bandit
├── clustering/          # NEW — k-means, DBSCAN, silhouette
├── optimisation/        # NEW — simulated annealing, coordinate/random-restart search
├── anomaly/             # NEW — z-score, isolation forest, CUSUM
├── graph/               # NEW — PageRank, shortest path, centrality
└── similarity/          # NEW — Hoeffding's D, distance correlation, JSD
```

**[PROPOSAL]** All new modules follow existing conventions:
- Pure functions, no I/O
- Comprehensive test suites
- TypeScript-native only (no Python/Rust dependencies; no sidecars)
- Serialisation support where streaming state is needed
- Ship as part of `@acme/lib` — zero new packages

If a capability requires non-TypeScript infrastructure to be viable, treat it as dropped from implementation scope until constraints change.

**[PROPOSAL]** Growth-loop capabilities from Section 3.4 should live as Business OS/control-plane contracts (stage artifacts, ledgers, and policies), not inside `packages/lib/src/math/`.

---

## 5. Prioritised Roadmap (Startup-Loop First)

### Track A — Growth Loop Operating System (Primary)

This track should lead. Without it, better algorithms mostly optimize local steps instead of compounding whole-loop growth.

#### Tier A0 — Immediate (next 2-4 weeks)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 1 | **Learning Compiler** (Opp L) | 1-2 weeks | Converts S10 readouts into actionable baseline priors; increases learning velocity |
| 2 | **Growth Accounting Kernel** (Opp M) | 1 week | Makes scale/hold/kill decisions explicit and auditable |
| 3 | **Hypothesis Portfolio Manager** (Opp N) | 1 week | Ranks bets by expected value and time-to-signal, not intuition |
| 4 | **Bottleneck Locator + Auto-Replan Trigger** (Opp R) | 3-5 days | Prevents repeated cycles on non-critical improvements |

#### Tier A1 — Short-term (1-2 months)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 5 | **Variant Factory** (Opp O) | 2-3 weeks | Improves experiment throughput and traceability |
| 6 | **Channel Budget Allocator v1** (Opp P) | 1-2 weeks | Faster weekly capital reallocation toward high-signal channels |
| 7 | **Customer Signal Ingestion** (Opp Q) | 1-2 weeks | Converts qualitative evidence into structured offer/channel improvements |
| 8 | **ICP/Offer Drift Detection** (Opp S) | 1 week | Detects when old assumptions stop fitting live market evidence |

#### Tier A2 — Medium-term (2-4 months)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 9 | **Distribution Compounding Engine** (Opp T) | 2-4 weeks | Builds durable referral/partnership growth loops |
| 10 | **Cross-Business Growth Memory Graph** (Speculative) | 2-3 weeks | Reuses validated patterns across businesses and reduces relearning cost |

### Track B — Math & Algorithm Accelerators (Secondary, Parallelizable)

#### Tier B0 — Immediate (next 2-4 weeks)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 11 | **A/B Testing Framework** (Opp C) | 1-2 weeks | Unblocks data-driven experiments across all apps |
| 12 | **Holt-Winters Seasonal Forecasting** (Opp D) | 1 week | Better demand prediction in seasonal businesses |
| 13 | **Advanced Similarity Metrics** (Opp K) | 3-5 days | Richer analytics and better re-ranking |

#### Tier B1 — Short-term (1-2 months)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 14 | **Content-Based Recommendations** (Opp A, stage 1) | 1-2 weeks | Immediate related-item recommendations from existing content |
| 15 | **Anomaly Detection Pipeline** (Opp E) | 1 week | Early warning for growth or revenue regressions |
| 16 | **Hypothesis Testing Suite** (extend statistics/) | 3-5 days | Better evidence quality in weekly decisions |

#### Tier B2 — Medium-term (2-4 months)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 17 | **Semantic Vector Search** (Opp B) | 2-3 weeks | Intent-based retrieval and better discovery UX |
| 18 | **Customer Segmentation** (Opp F) | 1-2 weeks | Targeted lifecycle messaging and offers |
| 19 | **Collaborative Filtering** (Opp A, stage 2) | 2 weeks | Higher cross-sell via behavior-driven recommendations |
| 20 | **Graph Algorithms for Business OS** (Opp G) | 1-2 weeks | Smarter dependency-aware prioritisation |

#### Tier B3 — Long-term / Research (3-6 months)

| # | Opportunity | Effort | Expected Impact |
|---|------------|--------|-----------------|
| 21 | **TS Non-Gradient Pricing Optimisation** (Opp H) | 3-4 weeks | Revenue optimization under non-linear constraints |
| 22 | **Causal Impact Toolkit (TS-lite)** | 3-5 weeks | Better attribution of channel/experiment impact |
| 23 | **Hybrid Recommendation + Re-ranking** (Opp A, stage 3) | 3-4 weeks | Full recommendation pipeline with advanced similarity |

---

## 6. Key Findings

1. **The repo has solid math primitives, but growth-loop compounding is the bigger bottleneck.** Better algorithms help, but the startup loop needs stronger learning, allocation, and decision contracts first.

2. **The current proposal set was too math-centric for the stated mission ("rapidly grow new businesses").** A startup-loop-first roadmap requires explicit capabilities like learning compiler, growth accounting kernel, and hypothesis portfolio management.

3. **Math upgrades are still valuable, but they should run as Track B behind Track A control-plane improvements.** Otherwise we optimize local stages without improving whole-loop velocity.

4. **Dicklesworthstone's most actionable short-term contribution remains similarity metrics and retrieval patterns.** Hoeffding's D/distance correlation and two-stage search are practical imports.

5. **Incompatible stack proposals (Rust/Python/sidecar) are explicitly out of scope.** Keep only TypeScript-compatible implementations, and drop the rest.

6. **A/B testing is still high leverage, but only when paired with portfolio-level experiment selection and baseline writeback.** Statistics without decision-routing still leaves growth speed on the table.

---

## 7. External References

- [fast_vector_similarity](https://github.com/Dicklesworthstone/fast_vector_similarity) — similarity metric definitions (reference for TS ports)
- [hoeffdings_d_explainer](https://github.com/Dicklesworthstone/hoeffdings_d_explainer) — Educational Hoeffding's D implementation
- [swiss_army_llama](https://github.com/Dicklesworthstone/swiss_army_llama) — two-stage retrieval architecture reference
- [model_guided_research](https://github.com/Dicklesworthstone/model_guided_research) — inspiration only (currently dropped for implementation)
- [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) — PageRank task prioritisation
- [llm_aided_ocr](https://github.com/Dicklesworthstone/llm_aided_ocr) — Tesseract + LLM OCR correction

---

## 8. Plan Status

All Tier A0 and B0 opportunities now have implementation plans.

### Track A — Growth Loop OS (Tier A0)

| # | Opportunity | Plan Document | Status |
|---|------------|---------------|--------|
| 1 | Learning Compiler (Opp L) | `docs/plans/learning-compiler-plan.md` | Planned |
| 2 | Growth Accounting Kernel (Opp M) | `docs/plans/growth-accounting-kernel-plan.md` | Planned |
| 3 | Hypothesis Portfolio Manager (Opp N) | `docs/plans/hypothesis-portfolio-manager-plan.md` | Planned |
| 4 | Bottleneck Locator + Auto-Replan (Opp R) | `docs/plans/bottleneck-locator-plan.md` | Planned |

### Track B — Math & Algorithm Accelerators (Tier B0)

| # | Opportunity | Plan Document | Status |
|---|------------|---------------|--------|
| 11 | A/B Testing Framework (Opp C) | `docs/plans/ab-testing-framework-plan.md` | Planned |
| 12 | Holt-Winters Forecasting (Opp D) | `docs/plans/holt-winters-forecasting-plan.md` | Planned |
| 13 | Advanced Similarity Metrics (Opp K) | `docs/plans/advanced-similarity-metrics-plan.md` | Planned |

---

## Next Steps

- [x] Pick Tier A0 + B0 items and open `/lp-plan` for each — **done** (7 plans created)
- [ ] Review plans and approve for `/lp-build` execution
- [ ] Review this revised roadmap with startup-loop owners; confirm Track A as primary
- [ ] Create a "shopping docket" for Section 3.5 speculative items (papers, OSS repos, case studies, benchmarks)
- [ ] Apply compatibility gate to remaining roadmap items (Tier A1/B1+): TypeScript/in-repo only, otherwise drop
- [ ] Run one concrete spike: port Hoeffding's D to TypeScript and validate numerically against reference implementation
