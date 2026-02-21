---
name: lp-do-discovery-04-business-name
description: Full naming pipeline orchestrator (DISCOVERY-04). Runs four parts in sequence: (1) produce naming-generation-spec.md from DISCOVERY docs, (2) agent generates 250 scored candidates, (3) RDAP batch check all .com domains, (4) filter to available names and produce ranked shortlist. Delivers a final operator-ready shortlist of domain-verified, scored brand name candidates.
---

# lp-do-discovery-04-business-name — Business Name Pipeline (DISCOVERY-04)

Orchestrates the complete four-part naming pipeline from a standing start to a domain-verified, ranked shortlist. The operator receives a shortlist where every name has a confirmed available .com and a multi-dimension quality score.

## When to use

Use when a brand name is open (not yet committed) and the business has completed DISCOVERY-03 (product option selected). Run on user instruction:

```
/lp-do-discovery-04-business-name --business <BIZ>
```

Rerunnable. If a spec and/or candidates file already exist from a prior round, the pipeline resumes from the correct part rather than starting over — see §Resume logic below.

---

## Pipeline overview

| Part | Name | What happens | Tool |
|------|------|--------------|------|
| 1 | **Spec** | Read DISCOVERY docs → write `naming-generation-spec.md` | Invoke `lp-do-discovery-04A-business-name-shaping` |
| 2 | **Generate** | Read spec → generate 250 scored candidates → write `naming-candidates-<date>.md` | Spawn general-purpose agent |
| 3 | **RDAP check** | Batch-check all .com domains → write `naming-rdap-<date>.txt` | Bash |
| 4 | **Rank** | Filter to available → sort by score → write `naming-shortlist-<date>.user.md` | Inline |

All four parts run sequentially. Each part gates on the output of the prior part.

---

## Execution

### Part 1 — Spec

Invoke the `lp-do-discovery-04A-business-name-shaping` skill for the target business. That skill reads the DISCOVERY docs and writes `docs/business-os/strategy/<BIZ>/naming-generation-spec.md`.

If `naming-generation-spec.md` already exists and a prior naming round has been run, the shaping skill updates the spec in place (adds newly eliminated names, refreshes ICP if changed). Do not skip Part 1 even if the spec exists — it must be current.

Gate: `naming-generation-spec.md` exists and is dated today before proceeding to Part 2.

---

### Part 2 — Generate

Spawn a **general-purpose agent** (model: opus) with the following prompt, substituting `<BIZ>` and `<SPEC_PATH>`:

> Read `<SPEC_PATH>` in full before doing anything else. Then generate exactly 250 brand name candidates following the spec exactly — §3 scoring rubric, §4 generation patterns and morpheme pools, §5 elimination list, §6 output format. Every name must have a pattern label, provenance note, and five dimension scores. Sort the output table by Score descending. After the table, write the one-paragraph summary required by §6. Save the complete output (table + summary) to `docs/business-os/strategy/<BIZ>/naming-candidates-<YYYY-MM-DD>.md`. Do not stop early. Do not skip the provenance notes. Do not reuse any name from §5.

Do not proceed to Part 3 until the candidates file exists and contains a table with ≥ 240 rows (allow for minor generation shortfall).

Gate: `naming-candidates-<date>.md` exists with ≥ 240 rows.

---

### Part 3 — RDAP batch check

Extract all names from the candidates file into a plain list. For Pattern D entries, use the **domain string** (e.g. `torevaco`), not the spoken name.

Run the following bash loop:

```bash
DATE=$(date +%Y-%m-%d)
BIZ="<BIZ>"
CANDIDATES="docs/business-os/strategy/${BIZ}/naming-candidates-${DATE}.md"
OUT="docs/business-os/strategy/${BIZ}/naming-rdap-${DATE}.txt"

# Extract names from the # | Name column (col 2) of the markdown table
# For Pattern D rows, extract domain string from col 5 instead
grep "^|" "$CANDIDATES" \
  | tail -n +3 \
  | awk -F'|' '{
      gsub(/^ +| +$/, "", $3);   # Pattern col
      gsub(/^ +| +$/, "", $2);   # Name col
      gsub(/^ +| +$/, "", $6);   # Domain string col
      if ($3 == "D" && $6 != "") print $6;
      else print $2
    }' \
  | grep -v "^$\|^Name$\|^Spoken" \
  > /tmp/hbag_names.txt

while IFS= read -r name; do
  name_lower=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://rdap.verisign.com/com/v1/domain/${name_lower}.com")
  if [ "$status" = "404" ]; then
    echo "AVAILABLE $name"
  elif [ "$status" = "200" ]; then
    echo "TAKEN     $name"
  else
    echo "UNKNOWN($status) $name"
  fi
done < /tmp/hbag_names.txt | tee "$OUT"

echo ""
echo "Available count: $(grep -c '^AVAILABLE' "$OUT")"
echo "Taken count:     $(grep -c '^TAKEN' "$OUT")"
```

Gate: `naming-rdap-<date>.txt` exists before proceeding to Part 4.

---

### Part 4 — Rank

Read the candidates table and the RDAP results file. Produce the final shortlist:

1. Filter the candidates table to rows where the name (or domain string for Pattern D) appears as `AVAILABLE` in the RDAP file
2. Sort by Score descending
3. For ties, sort by I (ICP resonance) descending, then alphabetically
4. Take the top 20 as the working shortlist

Save to `docs/business-os/strategy/<BIZ>/naming-shortlist-<YYYY-MM-DD>.user.md` with this structure:

```markdown
---
Type: Naming-Shortlist
Business-Unit: <BIZ>
Round: <N>
Created: <YYYY-MM-DD>
Domain-check: RDAP via Verisign, <YYYY-MM-DD>
Total candidates generated: 250
Total .com available: <N>
Presented: top 20 by score
---

# <BIZ> Naming Shortlist — <YYYY-MM-DD>

## Score key

| Column | Meaning | What a 5 looks like |
|--------|---------|---------------------|
| **D** | Distinctiveness — TM ownability, not confusable with competitors | Fully invented, no phonetic cousin in the category |
| **W** | Wordmark quality — works as a stamped logo, Instagram handle, Etsy shop name | 7–12 letters, strong visual rhythm, memorable in caps |
| **P** | Phonetics — smooth to say in both launch languages, memorable aurally | Flows naturally in IT + EN, soft vowels, 3–4 syllables |
| **E** | Expansion headroom — works for the brand beyond the initial product | Non-product-specific; fits any artisan leather object |
| **I** | ICP resonance — would the primary buyer stop scrolling at this name? | Immediately feels like a brand they'd follow on Instagram |
| **Score** | Sum of D + W + P + E + I | Max 25 |

## Top 20 (domain-verified, ranked by score)

| Rank | Name | Score | D | W | P | E | I | Pattern | Domain | Provenance |
|------|------|-------|---|---|---|---|---|---------|--------|------------|
...

## Score distribution (available names only)
- ≥ 18: N names
- 14–17: N names
- ≤ 13: N names

## Pattern breakdown (available names only)
- Pattern A: N
- Pattern B: N
- Pattern C: N
- Pattern D: N (spoken name / domain string)
- Pattern E: N

## Next step
Operator reviews top 20. Select 1–3 names for registrar confirmation (standard registration price check) and TM pre-screen before committing.

To reject the shortlist and trigger a new round, the operator says any of:
- "none of these work"
- "try again"
- "I don't like these"
- or any equivalent expression of rejection

The skill treats this as a **user-triggered new round** — see §New round below.
```

---

## Resume logic

If the pipeline is interrupted or rerun, check which parts are already complete:

| Condition | Resume from |
|-----------|-------------|
| No spec exists | Part 1 |
| Spec exists, no candidates file | Part 2 |
| Candidates file exists, no RDAP file | Part 3 |
| RDAP file exists, no shortlist | Part 4 |
| Shortlist exists | Pipeline complete — await operator review |

When resuming from Part 2 after a new round (new eliminated names added to spec), use a new date-stamped candidates filename so prior rounds are preserved.

---

## New round

A new round is triggered in two ways:

**Automatically** — if the quality gate finds fewer than 10 available names with score ≥ 14 after Part 4. The pipeline cannot deliver a credible shortlist from this result.

**User-triggered** — if the operator reviews the shortlist and rejects it (says "none of these work", "try again", "I don't like these", or equivalent). The operator may optionally say *why* (e.g. "too clinical", "wrong feel", "too similar to each other") — if they do, capture that as a **rejection note** and encode it as an additional anti-criterion in the next round's spec.

**New round procedure:**
1. Add all names from the current candidates file to §5.3 of `naming-generation-spec.md` as eliminated (reason: "domain taken" for RDAP-failed names; "operator rejected" for RDAP-available names the operator did not want). If a rejection note was given, add it as a new bullet under §6 Anti-Criteria.
2. Increment the round counter in the spec frontmatter.
3. Re-run Parts 2–4 with a fresh date stamp. Do not re-run Part 1 unless the ICP or product has changed.
4. Present the new shortlist to the operator.

There is no cap on the number of rounds. Each round adds all prior candidates to the elimination list, so the generation agent always works from a fresh search space.

---

## Quality gate (before declaring pipeline complete)

- [ ] `naming-generation-spec.md` updated today
- [ ] `naming-candidates-<date>.md` contains ≥ 240 rows with scores
- [ ] `naming-rdap-<date>.txt` contains a result line for every name in the candidates file
- [ ] `naming-shortlist-<date>.user.md` contains ≥ 10 AVAILABLE names with score ≥ 14
- [ ] All Pattern D entries in the shortlist list both spoken name and domain string
- [ ] If quality gate fails (< 10 available names scoring ≥ 14): trigger new round automatically

If the shortlist contains 0 names with score ≥ 14, or fewer than 5 available names total, trigger a new round: run Part 1 to add the current candidates to the elimination list, then re-run Parts 2–4 with a fresh date.

---

## Completion message

Present the top 10 from the shortlist inline in the conversation, preceded by the score key:

> **Score key:** D = Distinctiveness · W = Wordmark quality · P = Phonetics (IT+EN) · E = Expansion headroom · I = ICP resonance · Score = sum out of 25
>
> **Naming pipeline complete — <BIZ> Round N**
> N domain-verified names found from 250 candidates. Top 10:
>
> | Rank | Name | Score | D | W | P | E | I | .com domain |
> |------|------|-------|---|---|---|---|---|-------------|
> | 1 | ... | ... | ... | ... | ... | ... | ... | available |
> | ... |
>
> Full shortlist (top 20) saved to `naming-shortlist-<date>.user.md`.
> To select a name, say which one. To reject and try again, say "none of these work" — optionally tell me why and I'll encode it as a constraint for the next round.

---

## Integration

**Upstream (DISCOVERY-03):** Runs after `/lp-do-discovery-03-option-picking` produces a product decision record.

**Downstream (DISCOVERY-05):** `/lp-do-discovery-05-distribution-planning` runs after the operator confirms a working name from the shortlist.
