---
Type: Solution-Space-Prompt
Stage: DISCOVERY-02
Business: HEAD
Status: Active
Created: 2026-02-20
Method: back-propagated — generated from DISCOVERY-01 problem statement and existing HEAD research artifacts
Input: docs/business-os/strategy/HEAD/problem-statement.user.md
Results-artifact: docs/business-os/strategy/HEAD/2026-02-20-solution-space-results.user.md
---

# Solution Space Research Prompt — HEAD (DISCOVERY-02)

**How to use:** Drop this prompt into a deep research tool (OpenAI Deep Research, Perplexity Deep Research, or equivalent). Goal is to enumerate 5–10 distinct product-type approaches to the stated problem with feasibility signals only. No demand scoring — that is S2. Save the full tool output to `docs/business-os/strategy/HEAD/2026-02-20-solution-space-results.user.md`, then run `/lp-do-discovery-03-option-picking --business HEAD`.

---

## Role and Method

You are a product-type landscape researcher. Your task is to map the range of viable product-type approaches to a specific customer problem — not to recommend a product, but to enumerate options with honest feasibility signals. Treat each option independently. Do not score demand, estimate market size, or assess whether customers want this — that happens at a later stage. Feasibility flags only.

---

## Problem Context

*(From `problem-statement.user.md` — do not reframe.)*

**Core problem:** Parents/caregivers of children who wear external cochlear implant (CI) sound processors, and active teen/adult wearers, lack a reliable, low-friction system to (a) keep processors secure on the head through normal activity and (b) keep small, mission-critical accessories (spare coil, batteries, pods, retention parts) organised and transferable across daily handovers.

This causes drops, near-loss events, and repeated "where is it / who has it" moments, creating daily stress, time waste, social friction, and financial risk from damage or loss of expensive components.

**Primary affected user group:** Parents/caregivers of children wearing external CI processors. Child age ~12 months to ~12 years. Problem appears daily at routine choke points: morning setup, school drop-off/pick-up, sport, bedtime, travel. Multi-caregiver coordination compounds the problem.

**Secondary affected user group:** Active teen/adult CI processor wearers, ~16–45, for whom slippage during movement and accessory loss in transit are the primary frictions.

**Processor context:** Three main CI manufacturers — Cochlear Limited (~50–55% global share), MED-EL (~20–25%), Advanced Bionics (~15–20%). Physical form varies across brands; cross-brand compatibility is a purchase-decision constraint.

**Existing landscape (gap summary):** All three manufacturers sell brand-locked retention accessories (headbands, clips, pouches) at EUR15–51; clinical/functional design language, no cross-brand compatibility. An active English-language third-party market exists (Etsy sellers: Geniebands ~9k total sales, Ear Suspenders ~30k total sales) at EUR18–38. In Italy, hearing-retailer distribution of retention accessories exists but is fragmented, clinically coded, and lacks a lifestyle-first DTC brand with coherent range architecture and Italian-language UX. No systematic kit solution (multi-item organiser with handover-oriented design) exists from any source. Research candidates must be genuinely distinct from these options or represent a coherent upgrade on a documented failure mode.

**Organisation scope:** A typical CI user's daily carry is 6–12 items: spare coil, spare batteries, retention device, drying kit, cleaning tools, carry pouch, and (for children) teacher-instruction card and waterproof sleeve. Any solution addressing the organisation side of the problem must handle this full kit across multiple contexts (home, school bag, sport bag, travel).

---

## Solution Type Landscape

Enumerate 5–10 distinct product-type approaches that could address the stated problem. Options should differ in product category, not just features (e.g., physical textile product vs. digital app vs. accessory marketplace vs. custom-made service). Treat each independently.

For each option, provide feasibility signals only — not demand or market size estimates:

1. **Can this be launched by a small team (1–3 people) within 6 months with modest capital (<EUR50k)?**
2. **Are there proven distribution channels for this product type in Italy/EU?**
3. **What are the primary technical, operational, or capital constraints?**
4. **Is there evidence of adjacent successful businesses in this space?**

---

## Regulatory and Compliance Flags

For each option, flag any known regulatory, certification, or compliance requirements:
- EU MDR (Medical Device Regulation): does this product type risk classification as a medical device or accessory to a medical device? Note that EU MDR intended purpose is shaped by labelling and promotional statements — flag if the product type inherently carries this risk.
- CE marking requirements
- Child safety standards (particularly for any lanyard, tether, or cord-based solutions)
- Textile safety (REACH, Oeko-Tex)
- Flag "unknown" rather than omitting

---

## Manufacturing and Supply Chain Flags

For physical product options: typical MOQ ranges, lead times, key supplier geographies, and whether white-label options exist.
For digital options: infrastructure dependencies.
For service options: staffing and operational constraints.

---

## Deliverables Format

Return results as a structured list, one entry per option:
- Option name
- Brief description (2–3 sentences)
- Feasibility signals (bulleted, against the four criteria above)
- Regulatory flags
- Supply chain / operational flags

No comparison rankings, no recommendation, no verdict. Feasibility signals only.
