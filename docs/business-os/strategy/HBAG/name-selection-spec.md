---
Type: Generation-Spec
Business-Unit: HBAG
Status: Active
Created: 2026-02-21
Purpose: Agent-executable spec to generate 250 scored candidate brand names
Next: Run RDAP batch check on all 250, then filter and rank survivors by score
---

# HBAG — Name Generation Spec (Agent-Executable)

## Instructions for the agent running this spec

Generate exactly 250 brand name candidates for HBAG. For every name, produce a scored row in the output table defined in §6. Do not check domain availability — that is a separate automated step. Do not do trademark research. Your job is purely generation and scoring.

Read §1–§5 in full before generating any name. §3 (scoring rubric) and §4 (generation patterns + morpheme pools) are the core of this spec. §5 (elimination list) is a hard constraint — any name on it is automatically disqualified.

---

## §1. What this brand is (distilled from DISCOVERY)

Everything in this section is grounding for the scoring rubric. A name that fits this brand scores high. A name that could belong to any Italian accessories brand scores low.

**The product:** A Birkin-silhouette mini bag — structured body, gold hardware, leather-look exterior — sold as: (a) a bag charm clipped onto a larger handbag strap, (b) an AirPods Pro holder that clips onto a bag, and (c) a premium Amalfi Coast destination souvenir. Same physical object, three messaging angles. Price: €89–€149.

**The gap being filled:** A verified price vacuum between mass-market bag accessories (€5–35, no craft story, plastics) and the luxury-house register (€300+, logo-driven, inaccessible). This brand owns the premium artisan middle: €89–€149, craft provenance, Italian-origin, "reads real" in the hand and in photos.

**Primary buyer:** Women 27–42. LV/Gucci-entry-tier bag ownership (bags at €600+). Motivated by identity expression — "make it mine" — and by a desire for craft they can explain. Not buying logos. Buying visible skill and a specific aesthetic. Purchase deliberation: 3–7 days online. Discovery channel: Instagram, TikTok, Etsy visual search.

**Secondary buyer:** International tourists at Amalfi/Positano with high daily spend (~$400–$1,100/person/day) and a 1–3 day purchase window. Wants a premium wearable souvenir with a specific place-origin story — not a generic "Italian gift."

**Brand personality (locked):** Sophisticated, curated, feminine, confident, tasteful. Not trend-chasing. Not apologetic about the price. Not generic luxury. The bag charm trend is an entry point, not the identity.

**What the brand must NOT sound like:**
- A luxury house or its products (no Hermès/Birkin/Kelly/LV/Gucci phonetic adjacency)
- A mass-market accessories brand (no "Tiny," "Mini," "Charm" tropes)
- A generic Italian leather goods brand (no "Pelletteria di X," no place name alone)
- A tech product (the AirPods use case is a feature, not the brand)
- Clinical, corporate, or apologetic

**Growth intent:** The brand will extend to other artisan leather SLGs (pouches, cardholders, small accessories). The name must work for a broader leather goods universe, not just a bag charm.

---

## §2. Who the name is being evaluated for

When scoring, always ask: **would a 32-year-old woman in London or Milan, carrying a Neverfull, stop scrolling Instagram at this name?** That is the primary resonance test.

Secondary test: **could an Italian-speaking boutique owner in Positano say this name confidently to an American tourist?** That is the bilingual legibility test.

If a name passes both tests intuitively, it scores high on ICP resonance and phonetics. If it requires explanation, it scores lower.

---

## §3. Scoring rubric (score each name on all five dimensions, 1–5)

Score every generated name on the five dimensions below. Be honest — cluster-variants of the same root should not all score identically. Reserve 5s for names that genuinely stand out on that dimension.

### D — Distinctiveness (trademark ownability + category separation)
Does this name feel owned and unconfusable within the artisan accessories / leather goods space?
- **5:** Fully invented, no obvious phonetic cousin in the competitive set, strong TM ownability signal
- **4:** Coined or obscure real word, low competitor confusion risk
- **3:** Somewhat unique but shares phonetic territory with known brands or common Italian words
- **2:** Sounds like it could be many things; generic Italian feel; weak TM position likely
- **1:** Directly confused with a competitor, a luxury house product, or a known brand

### W — Wordmark quality (visual + typographic performance)
How does this name perform as a stamped leather logo, an Instagram handle, an Etsy shop name?
- **5:** 7–12 letters, strong visual rhythm, no awkward letter pairs, works in caps and mixed case, memorable as a handle
- **4:** Solid wordmark with minor reservations (slightly long, or a letter cluster that prints oddly)
- **3:** Functional but unremarkable; forgettable visually
- **2:** Too long (>13 letters), hard to abbreviate, or visually cluttered
- **1:** Does not work as a wordmark (unpronounceable, confusing visually, or too short to carry brand weight)

### P — Phonetic quality (smooth in Italian + English, no awkward clusters)
Is this name easy to say and remember in both languages? Does it feel right in the mouth?
- **5:** Flows naturally in both IT and EN, soft open vowels, no consonant clusters, 3–4 syllables, immediately memorable
- **4:** Mostly smooth; minor awkwardness in one language
- **3:** Pronounceable in both but no standout quality; forgettable aurally
- **2:** Awkward in one language; requires instruction to pronounce correctly
- **1:** Genuinely difficult or unpleasant to say in either language

### E — Expansion headroom (brand extensibility beyond the initial product)
Does this name work for a broader Italian artisan leather accessories brand — not just a bag charm?
- **5:** Completely non-product-specific; works for any premium Italian artisan object; suggests craft, place-quality, or emotion without limiting the category
- **4:** Strong umbrella potential with minor category pull toward accessories
- **3:** Works for leather goods broadly but feels slightly product-specific
- **2:** Only really works for the bag/charm product; would feel wrong on a cardholder or pouch
- **1:** Tied to a specific product form, function, or place in a way that traps the brand

### I — ICP resonance (would the primary buyer stop scrolling at this name?)
This is the hardest dimension to score honestly. Apply the test from §2.
- **5:** Immediately feels like a brand a fashion-aware 30-year-old LV buyer would follow on Instagram; warm, premium, slightly surprising, personal
- **4:** Appealing and on-tone; feels right for the category; might not stop the scroll but would not be scrolled past either
- **3:** Neutral; neither repels nor attracts the ICP specifically
- **2:** Too generic, too technical, or too serious to connect with the ICP
- **1:** Actively wrong for the ICP — sounds mass-market, corporate, clinical, or confusable with a male-targeted brand

### Composite score
Sum D + W + P + E + I. Maximum 25. Minimum 5.
Every name must have a composite score. Names with composite ≥ 18 are high-priority candidates for the RDAP batch check. Names 14–17 are secondary. Names ≤ 13 are low-priority but still included (domain availability may elevate them).

---

## §4. Generation patterns and morpheme pools

You must use one of the five patterns below for every name generated. State the pattern used in the output table. This is not optional — it exists to prevent clustering and ensure diversity.

**Target distribution across 250 names:**
- Pattern A: 80 names
- Pattern B: 50 names
- Pattern C: 50 names
- Pattern D: 40 names
- Pattern E: 30 names

**Root diversity rule:** No more than 4 names may share the same opening root (first 3 letters). Track this as you generate. If you have already generated 4 names starting with "Vel-", the next name must start with a different opening. This rule prevents the 250 becoming 20 roots × 12 suffix variants.

**Suffix diversity rule:** No more than 6 names may use the same suffix ending. Vary endings across the pools below.

---

### Pattern A — Extended coinages (9–12 letters, low squatter density)

Combine two Italian morpheme fragments. Neither fragment should be a common standalone Italian dictionary word. The result should feel Italian-phonetic but not be recognisable as a real word.

**Morpheme pool — first element (pick one):**
Veral-, Torin-, Salev-, Pontel-, Cerav-, Moril-, Bural-, Lutev-, Felir-, Gotav-, Lumev-, Carev-, Noril-, Pever-, Sirev-, Delav-, Ruvel-, Parev-, Torev-, Suriv-, Lucev-, Brivar-, Tariv-, Gorev-, Narev-, Pelav-, Korev-, Fariv-, Sorev-, Davel-

**Morpheme pool — second element (pick one):**
-ovina, -arella, -oneva, -elora, -ivona, -amora, -orena, -uleva, -imora, -avona, -erola, -inova, -elova, -onara, -ivela, -amola, -oreva, -ulona, -imela, -avola

**Construction rule:** Combine one first element with one second element. The result must be 9–12 letters total. If the combination produces an awkward consonant cluster at the join, adjust the join by dropping or modifying one letter. Document the adjustment.

**Examples of the type (do not reuse these):** Veralovina (too long — trim to Veralova), Torinella, Salevoneva, Pontelerola.

---

### Pattern B — Phonetic respelling of an Italian quality concept

Start from a real Italian word encoding a brand-relevant concept. Apply a systematic respelling to create a distinct token. The source word must not be a luxury trademark, must not be purely descriptive of leather goods, and must not be a common noun used in everyday commerce.

**Source concept pool (pick one — these are starting points, not final names):**
- *lucente* (shining, lustrous) — respelling target: modify vowels or ending
- *morbido* (soft, supple) — respelling target: change consonant cluster
- *impresso* (imprinted) — too close to luxury house; do not use
- *levigato* (smoothed, polished) — respelling target: trim and reshape
- *intarsiare* (to inlay) — respelling target: shorten and soften
- *brunire* (to burnish) — respelling target: extend with Italian suffix
- *cesellare* (to chisel, chase metalwork) — respelling target: shorten
- *ritoccare* (to retouch, finish) — respelling target: root only, reshape
- *orlatura* (hem/edging) — respelling target: modify ending
- *rifinire* (to finish, refine) — respelling target: shorten root
- *serrare* (to clasp, close firmly) — respelling target: reshape ending
- *lisciare* (to smooth) — respelling target: modify
- *tempra* (temper, character) — respelling target: extend
- *avvolgere* (to wrap, envelop) — respelling target: root only
- *carezzare* (to caress — but note: Carezza is eliminated; find adjacent root)
- *tornire* (to turn on a lathe, shape) — respelling target: extend
- *patinare* (to patinate) — respelling target: reshape
- *volgere* (to turn, shape) — respelling target: extend
- *vibrare* (to vibrate, resonate) — respelling target: reshape

**Respelling rules (apply at least one):**
1. Transpose one internal vowel (e.g., i→e, o→a)
2. Change a double consonant to a single (or vice versa)
3. Replace the ending (-are, -ire, -ore) with an Italian-phonetic brand suffix (-ova, -ella, -ina, -ora, -eva, -elo, -ari, -eno)
4. Truncate to the first two syllables and add a new suffix

Document: source word, meaning, respelling rule(s) applied, resulting token.

---

### Pattern C — Non-obvious root blend

Blend two Italian word fragments where **neither fragment is a common standalone noun or verb in Italian**. The goal: Italian phonotactics and emotional resonance, but no recognisable source word in any language.

This is distinguished from Pattern A by intent: Pattern A uses arbitrary morpheme fragments from a fixed pool. Pattern C starts from Italian phonotactic principles (open vowels, soft consonants, 2–3 syllables per fragment) and constructs fragments that *feel* like they could be Italian without being traceable to a specific word.

**Construction rules:**
- Fragment 1: 3–5 letters, must end in a vowel or soft consonant (l, r, n, v)
- Fragment 2: 3–6 letters, must begin with a vowel or soft consonant
- Total token: 7–11 letters
- Must not accidentally form a word in IT, FR, ES, DE, or EN
- Must be pronounceable by an English speaker on first read without instruction

**Phonotactic guidance for Fragment 1:**
- Preferred openings: V-, T-, C (as in "ch"), S-, R-, L-, F-, N-, P-
- Avoid: hard G-, hard K-, X-, Z- (sounds Germanic or Eastern European)
- Example fragment constructions (do not reuse): Vori-, Tela-, Sori-, Nevi-, Pola-, Celi-, Fori-, Rova-, Levi-

**Phonotactic guidance for Fragment 2:**
- Preferred: -ora, -ena, -iva, -elo, -ari, -ova, -ina, -elo, -ano, -one, -ola, -ela
- Avoid: -burg, -wick, -berg, -stein, -ski, -kov (non-Italian feel)

---

### Pattern D — Compound domain strategy

Generate a shorter coined root (6–8 letters) and pair it with a brand suffix to form a compound domain. The spoken/wordmark name is the short root. The domain is `<root><suffix>.com`.

**Permitted domain suffixes:** co, studio, atelier, casa, arte, mano, filo

**Output format for Pattern D:** list both the spoken name AND the intended domain string, e.g.:
- Spoken name: **Toreva** | Domain: `torevacc.com` — wait, this doesn't work. Use: Spoken name: **Toreva** | Domain: `torevaco.com`

**Construction rules:**
- The spoken root must still score well on all five dimensions on its own merits (it is the brand, the domain is just functional)
- The root must be 6–8 letters
- The domain compound must not exceed 15 characters total (excluding .com)
- The compound must not form a word or phrase in any language
- Generate the short root first, score it, then assign the best-fit domain suffix

---

### Pattern E — Obscure real Italian word (the Polène approach)

Find a real Italian word from a niche domain that: is not commonly known in everyday commercial use; is not descriptive of leather goods, bags, or accessories in Nice Classes 18/14/25; has a story the maker can tell in 10 seconds; and sounds premium, warm, and Italian to an English speaker.

**Source domains to mine (pick one per name):**
- Amalfi Coast / Campania regional geography or dialect vocabulary
- Italian Renaissance artisan craft terminology (goldsmithing, leatherwork, bookbinding, fresco technique)
- Italian textile vocabulary (weaving, dyeing, finishing) — terms not directly describing leather
- Coastal geology or cartography (names for specific coastal formations, light phenomena, tidal terms)
- Italian music or rhythm terminology used metaphorically
- Historical Italian merchant or trade vocabulary (pre-industrial)
- Italian botanical vocabulary specific to the Mediterranean coast (plants, not flowers)
- Campanian archaeological or historical site vocabulary

**Rules:**
- The word must be verifiably real — cite the source (dictionary, regional glossary, historical record)
- The word must not be descriptive or generic for leather goods in EU trademark terms — state why
- The word must not be a personal name, place name, or brand in current commercial use
- The word must be pronounceable in English without instruction
- Provide the meaning and the 10-second story hook for each

---

## §5. Eliminated names — do not generate any of these or close variants

The following 80 names have been generated and eliminated across three prior rounds. Do not re-propose them. Do not generate tokens where the first 5 letters match any of these names.

**Round 1:** Veloria, Orivella, Marevia, Cintara, Riflesso, OroLuce, Brunito, Lunavia, Carezza

**Round 2 (agent):** Pontevi, Spolvera, Torvina, Selvona, Tolvina, Caleva, Livorni, Corvina, Torvia, Torvella, Solvara, Belvara, Levona, Rivela, Morvela, Mareva, Colvara, Corvella, Mirova, Soleva, Selvina

**Round 3 (batch of 50 — all RDAP-confirmed taken):** Filaro, Filena, Filori, Filora, Orlena, Orenda, Cielia, Cerina, Cerelo, Ceravi, Arelia, Arelio, Arenia, Nerila, Nerino, Nerina, Sareli, Saremo, Sarena, Soreli, Luremi, Lurelo, Lurena, Lurino, Elaro, Elari, Elira, Elivo, Elora, Vireto, Viremi, Virelo, Vireva, Vemira, Vemilo, Vemari, Navilo, Navera, Rimelo, Rimera, Rimari, Rimola, Rimena, Savera, Savelo, Savina, Savora, Tenira, Tenela, Merina

---

## §6. Output format

Produce a single markdown table with exactly these columns. One row per name. 250 rows total.

```
| # | Name | Pattern | Spoken name (if Pattern D) | Domain string (if Pattern D) | Provenance note | D | W | P | E | I | Score |
```

**Column definitions:**
- **#** — sequential number 1–250
- **Name** — the brand name token
- **Pattern** — A, B, C, D, or E
- **Spoken name** — Pattern D only; the short root used as the wordmark
- **Domain string** — Pattern D only; e.g. `torevaco.com`
- **Provenance note** — one line: for A, the morphemes used; for B, source word + respelling rule; for C, fragment construction notes; for D, root construction + suffix choice; for E, source word + meaning + why non-descriptive
- **D** — Distinctiveness score 1–5
- **W** — Wordmark score 1–5
- **P** — Phonetic score 1–5
- **E** — Expansion score 1–5
- **I** — ICP resonance score 1–5
- **Score** — sum of D+W+P+E+I

Sort the output table by Score descending. Within the same score, sort alphabetically by Name.

After the table, produce a one-paragraph summary: how many names per pattern, score distribution (how many scored ≥18, 14–17, ≤13), and any observations about which patterns produced the strongest candidates.

---

*After generation, run the RDAP batch check against all 250 names. Filter to domain-available candidates only. Re-sort by Score. That filtered, scored list is the input to the final ranking step.*
