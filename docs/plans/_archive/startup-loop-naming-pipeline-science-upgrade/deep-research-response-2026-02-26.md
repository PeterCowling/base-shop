World-class naming pipeline design with scientific and mathematical foundations
Executive summary (what changes and why)
Bottom line: The current 4-step pipeline is not structurally sufficient for world-class outcomes because it (a) under-specifies the legal/market constraints that govern “viability”, (b) uses uncalibrated heuristic scoring without uncertainty, (c) treats domain checking as a simplistic HTTP-status classifier that is known to fail under standard RDAP semantics and operational profiles, and (d) lacks multi-round learning and yield forecasting (so repeatability and planning are weak). 

What the science says is being left on the table: Name evaluation and downstream performance are systematically affected by processing fluency (ease of processing, including pronounceability), which influences judgments like trust, risk perception, and preference; these effects can be robust across contexts, but also context-sensitive—meaning the pipeline must model uncertainty and exposure channels rather than only using “static” name scores. 

Recommended target state (one sentence): A stage-gated, probabilistic, multi-objective naming system with a pre-generation readiness gate, dynamic search allocation, calibrated scoring with uncertainty, and explicit legal/domain risk screening that updates priors across rounds. 

Evidence / inference / uncertainty legend used throughout

EVIDENCE: directly supported by cited sources.
INFERENCE: derived design implication (supported by sources, but not directly proven as “best pipeline”).
UNCERTAIN: evidence weak/conflicting; a validation test is proposed.
Prioritised action list (sorted by ROI × risk reduction)

Priority	Action	Why (mechanism)	ROI	Risk reduction	Evidence status
1	Replace “404=available / 200=taken” with a standards-conformant RDAP client (bootstrap + correct interpretation of 404/429 + retry/backoff + endpoint correctness)	RDAP specifies 404 for negative answers but operational profiles and rate limits (429) create false signals; registrar 404 may mean “not sponsoring” not “available”. 
Very high	Very high	EVIDENCE → INFERENCE
2	Add a pre-generation readiness gate: goods/services, jurisdictions, competitor set, phonetic/orthographic TM neighbourhood, linguistic markets, claim-risk lexicons	Likelihood-of-confusion is a global assessment depending on mark similarity and goods/services, channels, public attention; you cannot screen risk without these inputs. 
Very high	Very high	EVIDENCE → INFERENCE
3	Replace D/W/P/E/I with a calibrated probabilistic model that outputs P(survive all gates) + uncertainty	Fluency, memorability and distinctiveness have measurable correlates; legal gates are probabilistic; calibrated models enable thresholds tied to yield confidence rather than arbitrary point cutoffs. 
High	High	INFERENCE
4	Introduce multi-round learning: Bayesian updating of pattern yields + Thompson-sampling allocation of generation budget	Bandit/Bayesian methods formalise exploration/exploitation and improve allocation under uncertainty across rounds. 
High	Medium–High	EVIDENCE → INFERENCE
5	Add automated cross-lingual negative connotation + sentiment/emotion screening (with documented bias controls)	Large emotion/sentiment lexicons exist but have biases; still valuable as early-stage risk screening if calibrated and validated. 
Medium–High	High	EVIDENCE → INFERENCE
6	Add trademark-confusion proxies (orthographic + phonetic distance; neighbourhood density) as early risk filters (not “legal advice”)	Confusion analyses explicitly include appearance/sound/concept; distance metrics proxy similarity at scale, even if imperfect. 
Medium	High	EVIDENCE → INFERENCE
7	Implement formal validation: inter-rater reliability + power-aware perception tests + offline metrics	Reliability and effect-size/power practice is well-established; ensures repeatability and interpretable improvements. 
Medium	Medium	EVIDENCE → INFERENCE

Diagnostic audit of current pipeline
High-level diagnosis: The baseline pipeline optimises late-stage availability (domain) with limited upstream constraint modelling, but world-class naming requires the reverse: front-load constraint capture, then use cheap early gates, then apply expensive legal/market tests, all while tracking uncertainty and multi-round learning. The need for upstream legal context is implied by how likelihood of confusion is assessed (global assessment, interdependence of factors, similarity of marks and goods/services). 

Gap analysis table (Spec → Generate → Domain check → Rank)

Stage	Failure mode	Severity	Why it happens	Observable symptom	Recommended fix
Spec authoring	Missing legal-operational specification (jurisdictions, goods/services, channels)	Critical	Likelihood-of-confusion depends on similarity of marks and of goods/services + context factors; without scope, “risk” cannot be screened coherently. 
Many “great names” die late due to avoidable conflicts; repeated rework across rounds	Add “pre-generation readiness gate” requiring a minimum dataset (Section 2) and a legal-risk screening plan (framework only)
Spec authoring	No explicit “first exposure channel” model (search ad vs social scroll vs spoken referral)	High	Processing fluency and name effects are context-sensitive; exposure modality changes which features matter (spoken vs written). 
Names that look great fail when spoken (or vice versa); inconsistent stakeholder ratings	Capture channel-of-first-exposure constraints; separate spoken vs written evaluation tasks and features
Spec authoring	No cross-lingual / cultural hazard map (negative meanings, phonotactics, transliteration issues)	High	Fluency, sound symbolism, and affective associations vary across languages; screening requires lexicons + phonotactic models + market list. 
Late discovery of “bad in language X”; repeated candidate rejection	Add cross-lingual lexicon screening + language-specific phonotactic constraints (Sections 2 & 4)
Generation (exactly 250)	Fixed N without yield forecasting	High	Without modelling survival probabilities per gate, N=250 is arbitrary; viability is a binomial-style yield problem with uncertainty. 
Some rounds produce <20 viable candidates; other rounds waste effort	Replace fixed N with “N for K at 95% confidence” formula (Section 3) and Monte Carlo planning (Section 4)
Generation (pattern mix fixed A–E)	Fixed pattern allocation ignores empirical yield differences	Medium–High	Patterns have different base rates of (a) .com availability, (b) confusion risk, and (c) fluency; allocations should update across rounds (bandit/Bayesian). 
Repeatedly overproduces low-yield patterns; “we always get the same kinds of failures”	Add a generation strategy controller with Bayesian updating and Thompson sampling for allocation (Sections 4 & 5)
Scoring rubric (D/W/P/E/I)	Uncalibrated, non-identifiable scores (no ground truth mapping)	High	Without historical calibration, a 14/25 threshold is arbitrary; human judgment is noisy and must be modelled with reliability/uncertainty. 
Score inflation, rater drift, round-to-round inconsistency	Use pairwise preference modelling + calibration; produce probabilistic outputs and confidence bands (Section 3)
Scoring rubric	Conflates brand goodness with legal clearance; lacks explicit trademark-confusion proxy dimension	High	Confusion evaluation considers appearance/sound/concept plus goods/services; risk screening needs explicit similarity metrics and competitor neighbourhood maps. 
Top-ranked names are “nice” but high conflict probability	Add a separate legal-risk proxy objective (screening only) using distances + neighbourhood density (Sections 3 & 4)
Domain check (RDAP)	Interpreting HTTP codes as ownership truth without bootstrapping/operational caveats	Critical	RDAP uses 404 for “no data”, 429 for rate limiting; ICANN RDAP profiles define behaviours where 404 can occur for reasons other than non-existence (e.g., registrar not sponsoring). 
False “available” positives, inconsistent results, throttling failures, sudden drops in availability rate	Implement standards-conformant RDAP lookup: IANA bootstrap, correct server selection, handle 429/Retry-After, log errors, and verify with GET+JSON not status alone (Section 5)
Domain check	Only checks .com availability, not collision risks (homoglyphs, typos, pluralisation)	Medium	Domain availability ≠ domain safety; confusion can arise via typosquats/homoglyphs (risk screening, not legal advice). 
“Available” name still risky in search/typing contexts	Add typo/homoglyph neighbourhood generation as safety screen (Section 4)
Rank top 20	Top-20 ranking ignores uncertainty and human reliability	Medium–High	Human evaluation variance needs reliability measurement; without it, ranking is unstable. 
Stakeholder “whiplash”; top-5 changes weekly	Use pairwise tests + inter-rater reliability gates + probabilistic rank intervals (Sections 3 & 6)

Pre-generation information model
Design principle (INFERENCE): The minimum required dataset must make downstream gating well-posed: legal scope, linguistic markets, competitive neighbourhoods, and channel constraints are the “boundary conditions” for optimisation. This is implied by trademark confusion frameworks (global assessment of multiple factors) and by psycholinguistic evidence that processing depends on fluency and modality. 

Minimum required dataset (MRD) table

Field	Why it matters	How to collect it	Data type / schema	Cost/effort	Mandatory vs optional	Expected impact on outcome quality
Problem framing + success metric	EVIDENCE: Without a target utility, multi-criteria optimisation is undefined; later calibration requires an outcome definition. 
Workshop + written spec; define “viable finalist” and business constraints	{objective: string, KPIs: [string], failure_criteria:[string]}	Low	Mandatory	High
Goods/services scope + Nice-like classification	EVIDENCE: Goods/services similarity is central to confusion analysis; you need the intended scope early. 
Product/legal intake; map to classifications used in your filing jurisdictions	{classes:[{id:string, description:string}]}	Medium	Mandatory	High
Jurisdictions + launch markets	EVIDENCE: Legal standards and language exposure differ by jurisdiction; screening must match the markets. 
GTM plan + legal input	{countries:[ISO3166], priority_tiers:{tier1:[..],tier2:[..]}}	Medium	Mandatory	High
ICP psychographic language signals	EVIDENCE → INFERENCE: Language that reflects values/emotions can be operationalised with emotion/sentiment lexicons and embedding similarity; fluency affects evaluation and trust. 
Collect ICP verbatims, reviews, forums; embed + topic model + emotion tagging	{corpus_refs:[string], value_axes:[string], term_weights:{term:weight}}	Medium–High	Mandatory	High
Channel/context of first exposure	EVIDENCE: Spoken vs written processing differ; spelling affects memorability from auditory exposure; fluency effects vary by context. 
Media plan; identify top 3 channels + constraints (character limits, audio-only, etc.)	{channels:[{type:enum, constraints:{...}}]}	Low–Medium	Mandatory	High
Memorability constraints (spoken + written)	EVIDENCE: Brand-name memorability relates to linguistic characteristics; spelling-route effects exist; distinctiveness improves recall in general memory research. 
Define recall task + constraints (syllables, stress, orthographic uniqueness)	{spoken:{max_syllables:int}, written:{max_chars:int}, recall_task:enum}	Medium	Mandatory	High
Competitor set + adjacency map	EVIDENCE: Confusion and distinctiveness depend on competitor landscape; similarity must be evaluated against existing marks and market context. 
Market research + internal CRM; include direct + adjacent categories	{competitors:[{name:string, URL?:string, category:string}]}	Medium	Mandatory	High
Competitor + trademark phonetic neighbourhoods	EVIDENCE: Sound similarity matters in confusion assessment; phonological neighbourhood density is measurable and affects processing. 
Pull candidate competitor marks from databases; compute phonetic encodings + distance graph	{phonetic_index:{method:enum, nodes:[...], edges:[...]}}	High	Mandatory	Very high
Trademark search data sources plan	EVIDENCE: Official search tools exist (e.g., EUIPO availability guidance, USPTO search system); data access must be planned for automation. 
Decide: manual vs API vs vendor; document coverage and refresh	{sources:[{system:string, access:enum, cadence:enum}]}	Medium	Mandatory	High
Cross-lingual negative connotation lexicons	EVIDENCE: Emotion/sentiment lexicons exist; they have known bias issues that must be managed. 
Use multilingual sentiment resources + translation + human review for Tier-1 markets	{lexicons:[{lang:string, source:string, version:string}]}	Medium–High	Mandatory	High
Regulatory/claim-risk lexicons	EVIDENCE → INFERENCE: Regulatory enforcement focuses on misleading claims; screening lexicons can reduce obvious risk (not legal advice). 
Compile forbidden/trigger terms by vertical (health/finance/etc.) from regulatory guidance + counsel	{vertical:string, restricted_terms:[string], severity_map:{term:level}}	Medium–High	Mandatory (regulated verticals)	High
Domain-space priors by structural pattern	EVIDENCE → UNCERTAIN: RDAP supports existence checking, but public evidence on “pattern→availability” priors is not universal; you can estimate internally via sampling with correct RDAP bootstrapping. 
Random-sample strings per pattern; query .com RDAP; fit availability model	{pattern_id:string, prior:{alpha:float,beta:float}}	Medium	Optional initially → Mandatory for controller	Medium–High
Pronunciation model + locale mapping	EVIDENCE: Pronounceability impacts trust and risk judgments; cross-lingual phonotactics matter. 
Grapheme-to-phoneme for English + target locales; human spot-check	{locale:string, g2p_model:string, exceptions:[string]}	Medium	Mandatory	High
Script/transliteration policy	EVIDENCE → INFERENCE: Cross-lingual brand deployment requires transliteration consistency; sound symbolism can generalise across languages but not perfectly. 
Define for each market: keep Latin, transliterate, or localise name	{market:string, policy:enum, rules:[string]}	Medium	Optional	Medium
Sound-symbolism positioning targets	EVIDENCE: Phoneme choices can influence perceived attributes; applicable when you want congruent expectations. 
Decide attribute targets (e.g., potency vs softness); encode phoneme preferences	{attributes:[{name:string, desired_direction:enum}], phoneme_biases:{...}}	Medium	Optional	Medium–High
Orthographic distinctiveness constraints	EVIDENCE: Word frequency and neighbourhood structure affect processing; brand names show special visual processing patterns; spelling affects memorability. 
Define allowed bigrams, letter-shape constraints; compute neighbourhood metrics	{constraints:{min_edit_distance:int, forbidden_bigrams:[...]}}	Medium	Mandatory	High
Buyer attention / involvement level	EVIDENCE: Confusion analysis considers purchaser attention; impacts naming strategy (risk tolerance, descriptiveness). 
From GTM: impulse vs considered purchase; B2B vs B2C	{attention_level:enum, purchase_mode:enum}	Low	Optional	Medium
Brand architecture + extension map	EVIDENCE → INFERENCE: “Headroom” requires modelling future sub-brands and descriptors; avoids forced renames. 
Map expected product lines and naming system (house-of-brands etc.)	{architecture:enum, planned_extensions:[string]}	Medium	Mandatory	High
“Do-not-use” phoneme/grapheme list	EVIDENCE: Negative connotation and pronunciation difficulty can be screened early using lexicons/phonotactics. 
Linguist review + market input	{forbidden_substrings:[string], forbidden_phonemes:[string]}	Low–Medium	Mandatory	Medium–High
Logging + auditability requirements	EVIDENCE: Calibration and validation require preserved data; without logs you cannot measure improvement. 
Define event schema + storage + retention	{events:[{type:string, schema:object}], retention_days:int}	Medium	Mandatory	High

Note (UNCERTAIN but operationalisable): “Domain-space priors by pattern” will differ by language and by trend cycles; there is no single external truth to import—this should be measured continuously using your own RDAP sampling under correct bootstrapping and rate-limit handling. 

Scientific scoring architecture
Goal: Replace (or upgrade) D/W/P/E/I with a scoring system that (a) is explicitly multi-objective, (b) outputs probabilities and uncertainty, and (c) is calibratable from historical rounds and human judgments rather than fixed heuristics.

Proposed structure: “viability-first” probabilistic scoring (V-Score)
EVIDENCE foundation:

Trademark confusion is evaluated via multiple interdependent factors (global assessment; similarity of marks and goods/services can compensate). 
Processing fluency (incl. pronounceability) systematically affects judgments like trust, truthiness and perceived risk. 
Linguistic structure affects memorability (spelling route, linguistic characteristics). 
Phonotactic probability and neighbourhood density are measurable and influence processing/learning. 
Objects, constraints, and objective function
Let each candidate name be (x). Define:

Hard constraints (must-pass gates):

.com available (hard gate per boundary). Implement via RDAP correctly, not by naive status-only heuristics. 
No “critical negatives” in Tier-1 markets (lexicon + human review gate). 
Legal risk screening below threshold (proxy gate; not legal advice). 
Soft objectives (trade-offs):
Define feature groups, each scaled to ([0,1]) with uncertainty:

(F_{\text{phon}}(x)): phonological fluency & mispronunciation risk (locale-aware). 
(F_{\text{orth}}(x)): visual/orthographic fluency + letter/shape legibility proxies. 
(F_{\text{mem}}(x)): memorability proxy (distinctiveness + spelling-to-sound consistency). 
(F_{\text{sem}}(x)): semantic resonance with ICP psychographic signals. (Operationalised via embeddings + lexicon overlap.) 
(R_{\text{tm}}(x)): trademark confusion proxy risk (distance/neighbourhood). 
(R_{\text{reg}}(x)): regulatory/claim-risk triggers (vertical dependent). 
(H_{\text{arch}}(x)): architecture/headroom score (ability to extend without semantic collision). INFERENCE grounded in the fact that confusion and distinctiveness depend on context and semantic impression. 
Explicit objective function:
For candidates that pass all hard gates, maximise expected utility:

[ \max_{x \in \mathcal{X}} ;; \mathbb{E}[U(x)] = \mathbb{E}\Big[w^\top F(x) - \lambda^\top R(x)\Big] ]

where
(F(x) = [F_{\text{phon}}, F_{\text{orth}}, F_{\text{mem}}, F_{\text{sem}}, H_{\text{arch}}]) and
(R(x) = [R_{\text{tm}}, R_{\text{reg}}]),
weights (w,\lambda \ge 0), and expectations reflect uncertainty in measurements and human ratings. 

Weighting methodology: hybrid of expert structure + empirical calibration
Step A (initial weights, low data): Use AHP-style pairwise comparisons among criteria to elicit stakeholder priorities (strategy, design, legal risk tolerance). 

Step B (empirical weights, as data accumulates): Fit a pairwise preference model (Bradley–Terry family) from human comparisons of candidate names. This converts noisy judgments into a consistent latent score with uncertainty. 

A basic Bradley–Terry likelihood:

[ P(x_i \succ x_j) = \frac{\exp(\theta_i)}{\exp(\theta_i)+\exp(\theta_j)} ]

and (\theta_i) can be modelled as (\theta_i = \beta^\top \phi(x_i)) where (\phi(x)) are features from (F,R). 

Uncertainty: confidence intervals / credible intervals
Use Bayesian estimation so each candidate’s utility and rank have intervals, not point estimates:

Posterior on weights (p(\beta \mid \text{comparisons}))
Posterior predictive distribution of (U(x)) and rank
“Rank interval” = probability candidate is in top-K
This is standard Bayesian workflow for uncertainty-aware decision-making. 

Yield modelling formulas (planning N, gates, and confidence)
Let gates be (G_1,\dots,G_m). For candidate (x), define survival probability:

[ p_{\text{survive}}(x) = \prod_{k=1}^{m} P(G_k = 1 \mid x) ]

INFERENCE warning: The product assumes conditional independence; in practice, gates correlate (e.g., short names may have both higher trademark conflict and lower .com availability), so you should also fit a joint model or simulate with correlated factors. 

Expected viable yield per round (soft expectation): [ \mathbb{E}[Y] = \sum_{i=1}^{N} p_{\text{survive}}(x_i) ]

Probability at least (K) viable finalists:
If you approximate survival with a binomial (Y \sim \text{Binomial}(N,\bar{p})),

[ P(Y \ge K) = 1 - \sum_{y=0}^{K-1} {N \choose y}\bar{p}^y(1-\bar{p})^{N-y} ]

Minimum (N) for (K) viable finalists at 95% confidence: [ N^* = \min{N: P(Y\ge K)\ge 0.95} ]

Add uncertainty in (\bar{p}) via a Beta posterior (\bar{p}\sim \text{Beta}(\alpha,\beta)), producing a Beta–Binomial predictive distribution for (Y). This is a standard Bayesian approach to binomial rates. 

Math methods to add
Intent: Add a practical quantitative stack that improves precision, yield, and repeatability; label methods as high-value vs potentially overkill.

Method	What problem it solves	Inputs required	Computational complexity / practical cost	Implementation difficulty	Expected lift	Evidence status
Constrained multi-objective optimisation (e.g., Pareto front + selection)	Finds candidates that are non-dominated across fit/fluency/memorability while respecting hard legal/domain constraints	Feature vectors (F,R), hard constraints, candidate generator	Moderate; NSGA-II class methods are efficient for multiobjective search at scale	Medium	High	EVIDENCE → INFERENCE 
Bayesian updating across rounds (hierarchical priors)	Learns pattern yields, gate survival rates, and rater tendencies; improves repeatability	Historical rounds, gate outcomes, human comparisons	Moderate; standard Bayesian inference	Medium	High	EVIDENCE → INFERENCE 
Thompson-sampling allocation for generation strategy controller	Dynamically allocates candidate budget to patterns with best expected yield while still exploring	Per-pattern Beta posteriors (e.g., survival rate)	Low–Moderate	Medium	Medium–High	EVIDENCE → INFERENCE 
Monte Carlo yield forecasting	Produces distribution over viable candidates given gate uncertainties; supports planning and stop rules	Gate survival distributions, correlation assumptions	Low–Moderate	Low–Medium	High	EVIDENCE → INFERENCE 
Trademark confusion proxies (orthographic) using edit distance + neighbourhood density	Scalably screens similarity in appearance/typing; supports “phonetic neighbourhood” mapping	Candidate strings, competitor/trademark corpus	Low	Low	Medium–High	EVIDENCE → INFERENCE 
Trademark confusion proxies (phonetic) using phonetic alignment (ALINE-like) or phonology-aware distances	Screens aural similarity; closer to “sound” component of confusion	Phonetic transcriptions (G2P), feature-based similarity	Moderate	Medium–High	High	EVIDENCE → INFERENCE 
Phonotactic probability modelling (locale-specific)	Quantifies pronounceability/word-likeness; predicts ease of learning	Phoneme sequences, corpora/lexicons	Moderate	Medium	Medium–High	EVIDENCE → INFERENCE 
Memorability proxies (linguistic + orthographic) including spelling-route consistency	Predicts recall in spoken/written channels; catches “heard vs seen” mismatches	Candidate, G2P, orthographic features	Low–Moderate	Medium	Medium–High	EVIDENCE → INFERENCE 
Information-theoretic distinctiveness (surprisal / cross-entropy vs language model)	Measures “rarity” and distinctiveness statistically; supports novelty control	Character/phoneme LM trained on lexicon + competitor corpus	Moderate	Medium	Medium	EVIDENCE → INFERENCE 
Sensitivity analysis for thresholds and pattern allocations	Quantifies how shortlist quality changes with gates/weights; prevents brittle heuristics	Model, priors, thresholds	Low	Low	High	INFERENCE
Overkill warning: end-to-end neural “name success” predictor	Risk of spurious correlations; hard to interpret; may not transfer across domains	Massive labelled data	High	High	Unclear	UNCERTAIN (test with strict out-of-domain validation) 

Key practical inference: Most “lift” comes from (1) correct gating and scope definition, (2) calibrated uncertainty-aware scoring, and (3) dynamic allocation; exotic models are secondary until you have strong labelled outcomes and reliable human testing. 

Pipeline redesign
Design constraints respected: .com availability remains a hard gate; legal content is risk-screening framework only (no legal advice). RDAP gate is redesigned to be standards-conformant. 

Stage-gated v2/v3 architecture (entry/exit criteria explicit)

Stage	Inputs	Process	Quantitative gate (entry/exit criteria)	Output artifact	Owner
Pre-generation readiness gate	MRD fields (Section 2)	Validate completeness + internal consistency; freeze scope	Exit when all mandatory MRD fields present + signed	“Naming constraints pack” + “risk scope”	Hybrid (human lead + model checks)
Search-space design	Constraints pack; historical priors	Define patterns, morpheme sets, phonotactic constraints, negative lexicon constraints	Exit when feasibility ≥ target (simulated yield) and coverage of semantic space meets diversity targets	“Generation plan” incl. dynamic allocation priors	Hybrid
Generation strategy controller	Prior over pattern yields; budget	Allocate generation counts using Thompson sampling / Bayesian bandit	Exit when planned (N) satisfies (P(Y\ge K)\ge 0.95) under current priors	“Allocation table” + expected yield distribution	Model + human oversight 
Candidate generation	Allocation plan; constraints	Generate candidates (multiple mechanisms) + compute features	Entry: constraints validated; Exit: (N) candidates with feature vectors computed	Candidate set + feature store	Model
Early linguistic safety screen	Candidates + lexicons + phonotactics	Filter: profanity/negatives; phonotactic anomalies; spelling-to-sound instability	Exit: keep candidates with risk score below threshold and no critical negatives in Tier-1 markets	“Screened candidate set v1”	Model + linguist review
.com RDAP hard gate	Screened set v1	Standards-conformant RDAP lookup: bootstrap to correct server; GET JSON; handle 429 Retry-After; cache	Exit: .com_available = true	“Available candidate set v2” + RDAP logs	Model
Trademark risk screening gate (proxy)	v2 set + trademark corpus plan	Compute similarity to competitor/trademark neighbourhoods: orthographic + phonetic + semantic; flag high-risk	Exit: retain candidates where proxy risk < threshold and margin from nearest neighbours ≥ δ	“Low-risk candidate set v3” + neighbourhood graphs	Hybrid (model + IP ops) 
Human-in-the-loop ranking (pairwise)	v3 set + test protocol	Pairwise preference tasks by trained raters; fit Bradley–Terry; compute rank intervals	Exit: inter-rater reliability ≥ target and top-K stable (rank interval width ≤ ε)	“Shortlist with uncertainty”	Human + model 
Multi-round learning memory	All logs + outcomes	Update priors: gate survival rates, pattern yields, rater models; store failures by reason	Exit: priors updated; postmortem complete	“Round report” + updated priors	Hybrid 

Quantitative gates to replace heuristic thresholds (proposed defaults)
These are INFERENCE values meant to be calibrated; defaults are chosen to force explicit uncertainty tracking and reliability. 

Replace “shortlist ≥ 14” with:
Shortlist gate: retain candidate if posterior mean (\mathbb{E}[U(x)]) is in top (Q%) and lower 90% credible bound exceeds a floor (u_{\min}). 

Replace “high-priority ≥ 18” with:
High-priority gate: retain if (P(\text{top-10}) \ge 0.5) and (P(\text{legal proxy pass}) \ge 0.8) (proxy only), with rank interval width ≤ ε. 

Reliability gate: Krippendorff’s (\alpha \ge 0.80) for core categorical judgments (e.g., “fit yes/no”, “negative connotation yes/no”), otherwise re-train raters or refine rubric. 

Why .com gate must be implemented carefully (EVIDENCE):

RDAP negative answers return 404; rate limits return 429; profiles add operational requirements; authoritative service discovery uses IANA bootstrap per RFC 9224. 
Validation and experimentation design
Objective: Demonstrate the new pipeline is better on (a) viable yield, (b) human preference stability, (c) risk-screening precision, and (d) time/cost per viable finalist.

Offline evaluation metrics (before human panels)
Metric	Definition	Why it matters	Evidence basis
Viable yield rate	(\hat{p} = \frac{#\text{candidates surviving all gates}}{N})	Measures pipeline efficiency and planning reliability	Bayesian/binomial planning standard. 
Gate-specific pass rates	( \hat{p}_k = \frac{#G_k\text{ pass}}{#\text{entered }G_k})	Identifies bottlenecks; supports bandit allocation	RDAP and legal gates are operationally constrained. 
Calibration error	Brier score / log loss for predicted (P(\text{survive}))	Ensures probabilities mean what they say	Bayesian modelling best practice. 
Diversity coverage	Minimum distance / entropy over candidate feature space	Prevents mode collapse and repetitive name families	Information theory foundations. 
Trademark proxy precision@K (proxy)	Among names later judged “high risk”, were they flagged early?	Measures risk-screening usefulness (not legal)	Confusion considers sound/appearance; proxy should track these. 

Online / human testing plan (power-aware)
Task types (dense and operational):

Pairwise preference (fast, low cognitive load) → Bradley–Terry ranking with uncertainty. 
Pronunciation task (read aloud + self-rated ease + error rate) because ease of pronounceability influences trust/risk judgments. 
Recall task (delayed recognition/recall) because brand spelling and linguistic characteristics influence memorability. 
Inter-rater reliability strategy (EVIDENCE):
Use Krippendorff’s (\alpha) for categorical/ordinal ratings with missing data tolerance; target (\alpha \ge 0.80) for “decision-grade” labels. 

Power / sample-size guidance (practical defaults):

For mean-difference outcomes (e.g., pronounceability rating), plan around effect sizes and CI reporting; effect-size/power frameworks are standard. 
For pairwise preference where baseline win-rate is 50%, detecting a shift to 60% is a binomial proportion test problem; compute (n) from desired power and (\alpha). INFERENCE: Use conservative (n) because name effects can be small-to-medium and context-dependent. 
Decision rule for shipping vs rejecting a shortlist
A shortlist can ship if all conditions hold (INFERENCE, designed to be measurable):

Existence: ≥ (K) candidates pass .com gate and safety screens. 
Stability: top-10 rank intervals narrow (e.g., each has ≥0.5 probability of being in top-10 under posterior) and rater reliability ≥0.80. 
Risk screen: no candidate exceeds trademark proxy threshold; flagged names reviewed by IP ops for escalation (not legal advice). 
Channel fit: spoken and written tasks do not contradict (no high mispronunciation group for spoken-first channels). 
Implementation blueprint
Guiding principle (EVIDENCE → INFERENCE): Instrumentation and calibration are non-negotiable: without structured logs, you cannot validate improved yield, reliability, or probability calibration. 

30/60/90-day plan
Timeline	Deliverables	Dependencies	Risks	Success metric
30 days	MRD schema + readiness gate; RDAP client rewrite; start logging all pipeline events	Access to RDAP + storage	RDAP rate limiting; incomplete stakeholder inputs	RDAP false-positive rate drops; 100% runs have complete logs 
60 days	Trademark proxy module (distance + neighbourhood); cross-lingual lexicon screen; initial pairwise rater protocol	Trademark data access; linguist review	Proxy over-flags; lexicon bias	≥80% of late legal failures are flagged earlier (proxy) 
90 days	Calibrated probabilistic scoring; generation allocation controller (bandit); validation harness	Historical round data; rater training	Insufficient historical labels	Demonstrated uplift in viable yield or reduced cost per finalist with statistical confidence 

Data schema draft (artifacts + logs)
Below is a minimal JSON-style schema draft (operational, not exhaustive):

json
Copy
{
  run: {
    run_id: uuid,
    date_utc: iso8601,
    markets: [ISO3166],
    vertical: string,
    channels: [{type: enum, constraints: {}}],
    hard_gates: {tld: .com, must_pass: [no_critical_negatives, domain_available]}
  },
  candidate: {
    candidate_id: uuid,
    string: string,
    pattern_id: string,
    features: {
      phon_fluency: {mean: 0.0, sd: 0.0},
      orth_fluency: {mean: 0.0, sd: 0.0},
      memorability: {mean: 0.0, sd: 0.0},
      semantic_fit: {mean: 0.0, sd: 0.0},
      tm_risk_proxy: {mean: 0.0, sd: 0.0}
    },
    gates: {
      negatives: {pass: true, flags: []},
      rdap_com: {pass: true, http_status: 200, retry_count: 0},
      tm_proxy: {pass: true, nearest_neighbors: []}
    },
    human: {
      pairwise_wins: 0,
      pairwise_losses: 0,
      notes: []
    }
  },
  round_outcomes: {
    selected_finalists: [candidate_id],
    disposition: [{candidate_id: uuid, reason: enum}],
    priors_update: {pattern_survival: {pattern_id: {alpha: 0.0, beta: 0.0}}}
  }
}
Minimal viable version vs full version
Component	Minimal viable	Full version
RDAP gate	Standards-conformant .com RDAP + rate-limit handling	Multi-TLD bootstrap + caching + monitoring dashboards 
Scoring	Deterministic feature scoring + basic thresholds	Bayesian calibrated scoring + uncertainty + rank intervals 
Legal proxy	Basic orthographic distance to competitor marks	Phonetic + semantic + neighbourhood density + margin thresholds 
Learning	Manual postmortem notes	Automated priors update + bandit allocation 

What to instrument immediately in the existing pipeline
RDAP status code distribution including 429 and retry timing; treat 429 as first-class. 
Candidate “death reasons” taxonomy (domain, negative connotation, legal proxy, stakeholder rejection). INFERENCE
Inter-rater reliability on the current D/W/P/E/I rubric before changing it, to quantify baseline noise. 
Red-team critique
How this could still fail (top residual risks and mitigations)

Risk	Why it could sink the pipeline	Mitigation	Evidence status
RDAP false signals persist	Even conformant clients face inconsistent implementations and operational quirks	Use bootstrapping, caching, retries, and second-source verification; monitor error rates	EVIDENCE → INFERENCE 
Trademark proxy misleads	Distance ≠ legal confusion; semantics and goods/services matter	Treat as triage only; calibrate vs real outcomes; maintain escalation path	EVIDENCE → INFERENCE 
Lexicon bias causes false negatives/positives	Emotion/sentiment resources can be biased or incomplete	Market-tier human review; bias audits; track misses; use multiple lexicons	EVIDENCE 
Over-optimising for fluency reduces distinctiveness	Very fluent forms may cluster near existing words/marks	Multi-objective optimisation with explicit distinctiveness penalties	INFERENCE grounded in neighbourhood/density concepts 
Stakeholder drift breaks calibration	Teams change preferences midstream	Freeze weights per round; re-fit using pairwise comparisons; measure reliability	EVIDENCE → INFERENCE 
Small effects lead to inconclusive tests	Name effects can be modest and context-dependent	Power-aware designs; focus on decision-relevant effect sizes	EVIDENCE 
Cross-lingual deployment blindsides (script, transliteration)	Sound symbolism and fluency do not transfer perfectly	Tiered market strategy; locale-specific phonotactics and checks	EVIDENCE → INFERENCE 
Data sparsity for calibration	Few historical rounds with ground-truth outcomes	Start with AHP + small pairwise panels; grow dataset; hierarchical priors	EVIDENCE → INFERENCE 
Goodhart’s law on proxy scores	Teams chase numeric scores instead of real-world performance	Regularly rotate metrics; validate against human tests and later outcomes	INFERENCE
Operational costs balloon	Trademark data/API access, human panels, linguist reviews	Stage-gate aggressively; start minimal viable; measure cost per viable finalist	INFERENCE grounded in stage-gate economics 

Non-legal disclaimer: Trademark and regulatory elements above are risk-screening frameworks to triage candidate sets; formal clearance and legal advice require qualified counsel.
