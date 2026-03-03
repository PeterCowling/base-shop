---
Type: Business-Plan
Status: Draft
Business: PWRB
Created: 2026-01-29
Updated: 2026-01-29
Last-reviewed: 2026-01-29
Owner: Pete
Review-trigger: After each completed build cycle or PSP validation milestone touching this document.
---

# Powerbank Rental — Business Plan

## Strategy

### Current Focus (Updated 2026-01-29)

1. **Deposit Mechanism: Pre-auth Hold (Preferred) + Charge/Refund Fallback** (Priority: High)
   - Status: Pending PSP validation
   - Outcome: Target flow is AUTH €25 → void on return ≤52h → capture €25 on non-return (>52h)
   - Next: Verify PSP supports:
     - Authorization window ≥ 52h (or re-auth approach)
     - Capture on timeout, void on return
     - SCA handling for EU cards
   - Impact: Lower FX/refund friction and fewer deposit disputes
   - Source: PWRB-DEC-2026-01-29-01
   - Evidence type: assumption (pending PSP docs)
   - Data: Deposit/purchase €25; enforcement 52h; advertised 48h
   - Date: 2026-01-29

2. **Coverage Spec + Live Return Map (Source of Truth)** (Priority: High)
   - Status: Drafted
   - Outcome:
     - Core (year-round): Sorrento, Piano di Sorrento, Sant'Agnello, Meta
     - Seasonal ring: Positano (centre/port), Montepertuso, Nocelle; Praiano; Amalfi; Ravello; Maiori; Minori
     - Return promise points to live map (no brittle static town list on stations)
   - Next: Implement /return-map page + coverage copy + signage templates
   - Impact: Prevents promise breakage during rollout and winter consolidation
   - Source: PWRB-DEC-2026-01-29-02
   - Evidence type: manual decision reference
   - Data: Coverage breakdown + "live map" requirement
   - Date: 2026-01-29

3. **Pilot v1 Topology: Dense Core Only (10 Venues)** (Priority: High)
   - Status: Venue selection pending
   - Outcome: 10 venues concentrated in core towns for density + fast ops:
     - Suggested: Sorrento 4, Piano 2, Sant'Agnello 2, Meta 2
   - Next: Select venues from IPEI customer base; tier them; schedule installs
   - Impact: Reduces "islands" risk; improves return confidence; lowers service travel time
   - Source: PWRB-DEC-2026-01-29-03
   - Evidence type: manual decision reference
   - Data: Pilot size 10; towns core; distribution suggestion
   - Date: 2026-01-29

4. **Venue Revenue Share Bands (Two-Tier)** (Priority: High)
   - Status: Draft; validate economics in pilot
   - Outcome:
     - Tier 1: 30–35% of rental fees
     - Tier 2: 20–25% of rental fees
     - Excludes deposit/purchase
   - Next: Finalize contract language; define tiering criteria; lock payout schedule
   - Impact: Fast adoption; margin risk tracked in metrics
   - Source: PWRB-DEC-2026-01-29-04
   - Evidence type: manual decision reference
   - Data: Revenue share bands; rental pricing ladder
   - Date: 2026-01-29

5. **Hardware Procurement: 70/30 Station Mix (7 small / 3 large)** (Priority: High)
   - Status: SKU selection pending
   - Outcome: Pilot uses 7 small + 3 large stations; built-in tethered cables required
   - Next: Choose SKUs; order spares; label/serial scheme; winter storage SOP
   - Impact: Sufficient capacity where needed; minimal operational complexity
   - Source: PWRB-DEC-2026-01-29-05
   - Evidence type: manual decision reference
   - Data: Hardware posture 70/30; pilot 10 venues
   - Date: 2026-01-29

6. **IPEI Access + Staff Usage Agreement (No Revenue Share)** (Priority: High)
   - Status: Not drafted
   - Outcome: Founder (IPEI director) sells into existing customer base; staff available on-demand; NewCo remains sole revenue owner
   - Next: Draft services/access agreement:
     - scope (install, swap, troubleshooting)
     - scheduling rules and escalation
     - cost-basis accounting (even if internal)
     - liability boundary
   - Impact: Prevents operational ambiguity; reduces dependency risk
   - Source: PWRB-DEC-2026-01-29-06
   - Evidence type: manual decision reference
   - Data: "no revenue share with IPEI"; staff use allowed
   - Date: 2026-01-29

7. **Purchase Grace + Warning Cadence + Late Return Handling** (Priority: Medium)
   - Status: Draft policy
   - Outcome: Advertise 48h; enforce purchase at 52h; warning messages at 36/44/48h; define late-return buyback window
   - Next: Encode state machine + messaging; include in terms
   - Impact: Lowers disputes and accidental purchases
   - Source: PWRB-DEC-2026-01-29-07
   - Evidence type: manual decision reference
   - Data: 52h enforcement; messaging schedule
   - Date: 2026-01-29

8. **Winter Mode: Consolidate + Pause Connectivity** (Priority: Medium)
   - Status: Selected
   - Outcome: Core remains; seasonal ring removed; connectivity paused; minimal footprint Nov–Mar
   - Next: Contract clause for removal; storage plan; battery maintenance schedule
   - Impact: Preserves cash; reduces idle connectivity costs; maintains fleet health
   - Source: PWRB-DEC-2026-01-29-08
   - Evidence type: manual decision reference
   - Data: Winter strategy choice
   - Date: 2026-01-29

## Risks

### Active Risks

- **Deposit Mechanics Failure** (Severity: High, Added: 2026-01-29)
  - Source: PWRB-RISK-001
  - Impact: Abandonment + disputes if deposit perceived as charge; FX/refund friction; multiple holds if re-auth poorly handled
  - Mitigation: Prefer pre-auth hold; single-auth lifecycle; clear UX/receipt language; implement auth expiry handling
  - Evidence type: assumption
  - Data: Deposit/purchase €25; enforcement 52h
  - Date: 2026-01-29

- **Auth Expiry Before Enforcement** (Severity: High, Added: 2026-01-29)
  - Source: PWRB-RISK-002
  - Impact: Unable to capture purchase at 52h → revenue loss + customer confusion
  - Mitigation: PSP validation; re-auth strategy near expiry; purchase enforcement buffer
  - Evidence type: assumption
  - Data: Enforcement 52h; purchase €25
  - Date: 2026-01-29

- **Pilot Density Insufficient** (Severity: High, Added: 2026-01-29)
  - Source: PWRB-RISK-003
  - Impact: Users can't find returns; increased purchases/non-returns; bad reviews
  - Mitigation: Concentrate 10 venues in year-round core; expand after stability
  - Evidence type: other (operational reasoning)
  - Data: 10 venues; 4 towns core
  - Date: 2026-01-29

- **Margin Compression from Revenue Share Bands** (Severity: Medium, Added: 2026-01-29)
  - Source: PWRB-RISK-004
  - Impact: Thin unit margin at €3–€6 ladder after fees + ops + share
  - Mitigation: Validate pilot P&L; consider tightening bands for new venues after evidence; automate support
  - Evidence type: assumption
  - Data: Tier 1 30–35%; Tier 2 20–25%; pricing ladder
  - Date: 2026-01-29

- **IPEI Staff Availability / Priority Conflicts** (Severity: Medium, Added: 2026-01-29)
  - Source: PWRB-RISK-005
  - Impact: Slow repairs → downtime → disputes + venue dissatisfaction
  - Mitigation: Services/access agreement with scheduling rules; maintain backup contractor option
  - Evidence type: assumption
  - Data: "use staff when needed"; no revenue share
  - Date: 2026-01-29

- **Accidental Purchase / Late Return Disputes** (Severity: Medium, Added: 2026-01-29)
  - Source: PWRB-RISK-006
  - Impact: Chargebacks + negative reviews
  - Mitigation: 52h enforcement; warning cadence; late-return buyback policy
  - Evidence type: manual decision reference
  - Data: 36/44/48h warnings; 52h enforcement
  - Date: 2026-01-29

- **Winter Storage Degradation** (Severity: Medium, Added: 2026-01-29)
  - Source: PWRB-RISK-007
  - Impact: Battery degradation; higher replacement cost; poor next-season reliability
  - Mitigation: Dry storage; maintenance charge cycle SOP; pause connectivity for removed stations
  - Evidence type: assumption
  - Data: Winter strategy: consolidate + store
  - Date: 2026-01-29

## Opportunities

### Validated (Ready for Cards)

- **Implement Pre-auth Hold Deposit Flow**
  - Evidence: PSP docs confirmation (pending)
  - Value: Reduced friction + disputes; removes FX refund loss concern
  - Effort: M
  - Recommend: Create card "PWRB-PAY-01" to implement auth/void/capture + expiry handling
  - Source: PWRB-DEC-2026-01-29-01
  - Evidence type: assumption → vendor-quote/docs once verified
  - Data: €25 hold; 52h enforcement
  - Date: 2026-01-29

- **Live Return Map + Coverage Copy (incl. Montepertuso/Nocelle)**
  - Evidence: Manual decision reference
  - Value: Accurate operational promises; supports seasonal contraction without signage churn
  - Effort: S/M
  - Recommend: Create card "PWRB-MAP-01"
  - Source: PWRB-DEC-2026-01-29-02
  - Evidence type: manual decision reference
  - Data: Core + seasonal ring breakdown
  - Date: 2026-01-29

- **Dense Core Pilot (10 venues)**
  - Evidence: Manual decision reference
  - Value: Fast learning + lower ops cost
  - Effort: M
  - Recommend: Create card "PWRB-PILOT-01" (venue list, installs, monitoring)
  - Source: PWRB-DEC-2026-01-29-03
  - Evidence type: manual decision reference
  - Data: 10 venues; core towns; suggested split
  - Date: 2026-01-29

### Under Investigation

- **Seasonal Ring Activation Thresholds**
  - Source: Strategy requirement
  - Status: Not started
  - Next: Define minimum density per town + service response model before adding seasonal ring nodes
  - Evidence type: assumption
  - Data: Town list seasonal ring
  - Date: 2026-01-29

- **Hotel Desk "Rescue Kit" Module**
  - Source: Operational need (dead-phone users)
  - Status: Optional module
  - Next: Identify 1–2 hotels for a desk-based test after pilot stability
  - Evidence type: assumption
  - Data: Module definition pending
  - Date: 2026-01-29

## Learnings

### 2026-01-29: Plan Formation & Parameter Lock-in

- **What worked:**
  - Simplified ladder pricing + single €25 deposit/purchase anchor
  - Clear year-round core selection (Sorrento/Piano/Sant'Agnello/Meta)

- **What didn't work:**
  - Dispersed pilot across multiple towns for only 10 venues (rejected)

- **Process improvements:**
  - Gate rollout on PSP confirmation for pre-auth holds (avoid redesign mid-pilot)

- **Technical insights:**
  - Live map is required to avoid brittle return promises, especially with winter consolidation

## Outcome Contracts

_Not yet defined. To be populated when the startup loop is formally started and the first 90-day outcome is agreed._

## Metrics

### Pilot Health (Updated 2026-01-29)

- **Rentals/day/station:** Baseline TBD → Target ≥ 2.0 within 4 weeks
  - Source: PWRB-PILOT-METRICS-01
  - Measurement: rental events / station-day
  - Target: ≥ 2.0 by week 4

- **Return success rate (≤52h):** Baseline TBD → Target ≥ 95%
  - Source: PWRB-PILOT-METRICS-02
  - Measurement: % rentals with confirmed return event ≤52h
  - Target: ≥ 95% in pilot

- **Purchase rate (>52h):** Baseline TBD → Target ≤ 3%
  - Source: PWRB-PILOT-METRICS-03
  - Measurement: % rentals that reach purchase state
  - Target: ≤ 3% in pilot

- **Support tickets/100 rentals:** Baseline TBD → Target ≤ 2.0 by week 4
  - Source: PWRB-PILOT-METRICS-04
  - Measurement: manual tickets logged / 100 rentals
  - Target: ≤ 2.0 by week 4

- **Chargebacks/100 rentals:** Baseline TBD → Target ≤ 0.3
  - Source: PWRB-PILOT-METRICS-05
  - Measurement: PSP disputes / 100 rentals
  - Target: ≤ 0.3 in pilot

### Network Behavior (Updated 2026-01-29)

- **Inter-town return %:** Baseline TBD
  - Source: PWRB-PILOT-METRICS-06
  - Measurement: % returns in different town than rental start (using town tags from venue metadata)
  - Target: Track + inform balancing policy decisions by week 4

- **Town drift (units/week):** Baseline TBD
  - Source: PWRB-PILOT-METRICS-07
  - Measurement: returns_in − rentals_out per town per week
  - Target: Identify systematic drift; decide if balancing route is needed
