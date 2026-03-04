# Parts 1–3: Spec, Generate, RDAP Check

## Pipeline overview

| Part | Name | What happens | Tool |
|------|------|--------------|------|
| 1 | **Spec** | Read ASSESSMENT docs → write `<YYYY-MM-DD>-naming-generation-spec.md` | Invoke `lp-do-assessment-05-name-selection` |
| 2 | **Generate** | Read spec → generate 250 scored candidates → write `naming-candidates-<date>.md` | Spawn general-purpose agent |
| 3 | **RDAP check** | Batch-check all .com domains → write `naming-rdap-<date>.txt` | Bash |
| 4 | **Rank** | Filter to available → sort by score → write `naming-shortlist-<date>.user.md` | Inline |
| 5 | **Render HTML** | Convert shortlist + research context → write `naming-shortlist-<date>.user.html` | Inline |

All five parts run sequentially. Each part gates on the output of the prior part.

---

## Execution

### Part 1 — Spec

Invoke the `lp-do-assessment-05-name-selection` skill for the target business. That skill reads the ASSESSMENT docs and writes `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/<YYYY-MM-DD>-naming-generation-spec.md`.

If `<YYYY-MM-DD>-naming-generation-spec.md` already exists and a prior naming round has been run, the shaping skill updates the spec in place (adds newly eliminated names, refreshes ICP if changed). Do not skip Part 1 even if the spec exists — it must be current.

Gate: `<YYYY-MM-DD>-naming-generation-spec.md` exists and is dated today before proceeding to Part 2.

---

### Part 2 — Generate

Spawn a **general-purpose agent** (model: opus) with the following prompt, substituting `<BIZ>` and `<SPEC_PATH>`:

> Read `<SPEC_PATH>` in full before doing anything else. Then generate exactly 250 brand name candidates following the spec exactly — §3 scoring rubric, §4 generation patterns and morpheme pools, §5 elimination list, §6 output format. Every name must have a pattern label, provenance note, and five dimension scores. Sort the output table by Score descending. After the table, write the one-paragraph summary required by §6. Save the complete output (table + summary) to `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/naming-candidates-<YYYY-MM-DD>.md`. Do not stop early. Do not skip the provenance notes. Do not reuse any name from §5.

Do not proceed to Part 3 until the candidates file exists and contains a table with ≥ 240 rows (allow for minor generation shortfall).

Gate: `naming-candidates-<date>.md` exists with ≥ 240 rows.

---

### Part 3 — RDAP batch check

Extract all names from the candidates file into a plain list. For Pattern D entries, use the **domain string** (e.g. `torevaco`), not the spoken name.

Run the following bash loop:

```bash
DATE=$(date +%Y-%m-%d)
BIZ="<BIZ>"
CANDIDATES="docs/business-os/strategy/${BIZ}/assessment/naming-workbench/naming-candidates-${DATE}.md"
OUT="docs/business-os/strategy/${BIZ}/assessment/naming-workbench/naming-rdap-${DATE}.txt"

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
