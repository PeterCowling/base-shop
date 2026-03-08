# Spec Sections §5–§6 — Hard Blockers, Output Format, and Quality Gate

### §5. Hard blockers and elimination list

#### 5.1 Domain availability gate (copy verbatim — do not rewrite)

.com availability at standard registration price is a prerequisite for shortlisting. Domain checking is a separate automated step (Part 3 of the pipeline) — the generation agent does NOT check domains. The agent generates and scores only.

**RDAP verification protocol (for Part 3):**
1. `curl -s -o /dev/null -w "%{http_code}" "https://rdap.verisign.com/com/v1/domain/<name>.com"` — 404 = unregistered, 200 = registered
2. For names passing step 1, confirm with a registrar (Namecheap, GoDaddy) that the domain is at standard registration price, not broker/aftermarket pricing
3. Document: RDAP result, registrar result, date checked

.eu and .it are desirable but secondary. .com is the only hard gate.

#### 5.2 Why short coinages fail (copy verbatim — do not rewrite)

Short pronounceable coinages (5–8 letters) with Romance-language phonotactics are almost entirely exhausted in the .com namespace. Domain investment funds systematically register every plausible 5–8 letter token with open vowels, soft consonants, and common suffixes. Three naming rounds for this business produced 80 candidates; 80/80 .com domains were taken.

**Length guidance for all patterns:**
- Prefer 9–12 letter tokens
- 6–8 letter tokens permitted only with Pattern D (compound domain) or Pattern E (obscure real word with verified domain)
- Do not generate 5-letter coinages

#### 5.3 Eliminated names

*[Populate from all prior naming rounds for this business. Format as a simple list with round and reason. If this is the first naming round, write "None — first naming run." Update this list on each subsequent run of the skill.]*

Example format:
```
**Round 1 (YYYY-MM-DD):** Name1 (.com taken), Name2 (.com taken), Name3 (active brand conflict)
**Round 2 (YYYY-MM-DD):** Name4 (.com taken), Name5 (active brand conflict)
```

---

### §6. Output format (copy verbatim — do not rewrite)

Produce a single markdown table with exactly these columns. One row per name. 250 rows total.

```
| # | Name | Pattern | Spoken name (Pattern D only) | Domain string (Pattern D only) | Provenance note | D | W | P | E | I | Score |
```

**Column definitions:**
- **#** — sequential 1–250
- **Name** — the brand name token
- **Pattern** — A, B, C, D, or E
- **Spoken name** — Pattern D only
- **Domain string** — Pattern D only (e.g. `torevaco.com`)
- **Provenance note** — one line: morphemes used (A); source word + rule (B); fragment notes (C); root + suffix (D); source word + meaning + why non-descriptive (E)
- **D / W / P / E / I** — dimension scores 1–5
- **Score** — sum D+W+P+E+I

Sort output by Score descending. Within same score, sort alphabetically.

After the table, write a one-paragraph summary: names per pattern, score distribution (>=18 / 14–17 / <=13), observations on which patterns produced the strongest candidates.

---

## Quality gate (before saving)

- [ ] §1 populated from ASSESSMENT docs (not generic placeholder text)
- [ ] §2 resonance tests are specific to this business's ICP (not generic "fashion buyer")
- [ ] §3 ICP resonance dimension (I) references the specific buyer from §2
- [ ] §4.2 morpheme pools and source domains are business-specific (not generic Italian vocabulary)
- [ ] §5.3 elimination list populated (or explicitly marked "None — first naming run")
- [ ] All universal sections (§3 D/W/P/E, §4.1, §5.1, §5.2, §6) copied verbatim — no rewrites
- [ ] Length guidance reflected in §4.1 (no 5-letter coinage instruction present)
- [ ] Regulatory constraints encoded in §1 "what the brand must NOT sound like" if applicable
