---
Type: Analysis-Output
Status: Active
Business: BRIK
Generated: 2026-02-17
Source-File: data/octorate/octorate-calendar-2026-02-14.xlsx
Source-Data-Date: 2026-02-14
Script: scripts/brik/analyse-room-pricing.py
---

# Brikette — Room Pricing Analysis

> **Generated:** 2026-02-17  
> **Source data:** `data/octorate/octorate-calendar-2026-02-14.xlsx` (Octorate export dated 2026-02-14)  
> **Script:** `scripts/brik/analyse-room-pricing.py`  
> **Refresh:** Run `pnpm brik:analyse-room-pricing` after each new Octorate export.

Prices below are drawn from the `Price` sheet of the Octorate calendar export.
Each cell shows the observed price range across all dates in the season band, plus the median.
These are the headline OTA rates (refundable rate plan). Direct/non-refundable rates may differ.

**Season bands:**
- Low: Nov–Mar
- Mid: Apr–May, Sep–Oct
- Peak: Jun–Aug

---

## Pricing by Room

| Room | Type | Gender | Cap | Low (Nov–Mar) | Mid (Apr–May, Sep–Oct) | Peak (Jun–Aug) |
|---|---|---|---|---|---|---|
| Room 3 | dorm | female-only | 8 | EUR 70–87 (median EUR 87) | EUR 70–121 (median EUR 96) | EUR 106–128 (median EUR 121) |
| Room 4 | dorm | mixed | 8 | EUR 73–87 (median EUR 87) | EUR 60–121 (median EUR 96) | EUR 106–128 (median EUR 121) |
| Room 6 | dorm | female-only | 7 | EUR 88–108 (median EUR 108) | EUR 84–151 (median EUR 126) | EUR 140–160 (median EUR 150) |
| Room 10 | dorm | mixed | 6 | EUR 65–95 (median EUR 95) | EUR 65–133 (median EUR 111) | EUR 123–141 (median EUR 132) |
| Room 5 | dorm | female-only | 6 | EUR 80–108 (median EUR 108) | EUR 80–151 (median EUR 126) | EUR 140–160 (median EUR 151) |
| Room 11 | dorm | female-only | 6 | EUR 75–114 (median EUR 114) | EUR 75–178 (median EUR 139) | EUR 150–178 (median EUR 169) |
| Room 12 | dorm | mixed | 6 | EUR 99–114 (median EUR 114) | EUR 99–178 (median EUR 139) | EUR 150–178 (median EUR 169) |
| Room 9 | dorm | mixed | 3 | EUR 88–104 (median EUR 104) | EUR 84–150 (median EUR 126) | EUR 140–153 (median EUR 150) |
| Room 7 | private | n/a | 2 | EUR 225–345 (median EUR 297) | EUR 225–552 (median EUR 371) | EUR 300–576 (median EUR 506) |

---

## Data Quality Notes

- Prices are per the OTA refundable rate plan only. Non-refundable and direct-booking rates are not captured in this export.
- Room 8 is excluded (staff accommodation, not for sale in 2026).
- The apartment (2025-14) will appear with no data until it is configured in the Octorate calendar.
- Sample size (n) per season reflects number of date rows with a non-zero price for that room.
  A room showing `—` for a season either has no dates in that season in the export window, or prices are not yet set.
- **Per-bed vs per-room ambiguity:** Smaller rooms price higher than larger rooms (e.g. Room 9 at 3 beds > Room 3 at 8 beds),
  which is consistent with per-bed pricing. Confirm with Pete whether Octorate rates are per bed or per room total.
  This affects ADR and RevPAR calculations.

---

## Sample Sizes

| Room | Low (n) | Mid (n) | Peak (n) |
|---|---|---|---|
| Room 3 | 46 | 244 | 184 |
| Room 4 | 38 | 244 | 184 |
| Room 6 | 37 | 243 | 184 |
| Room 10 | 46 | 244 | 184 |
| Room 5 | 46 | 244 | 184 |
| Room 11 | 46 | 244 | 184 |
| Room 12 | 37 | 243 | 184 |
| Room 9 | 37 | 243 | 184 |
| Room 7 | 46 | 244 | 184 |

---

_This file is auto-generated. Do not edit manually — re-run the script instead._
