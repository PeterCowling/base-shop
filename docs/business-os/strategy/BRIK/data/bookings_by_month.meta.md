---
Type: Reference
Status: Active
---

# bookings_by_month.csv provenance

- source file: `/Users/petercowling/Downloads/export_19519177.xls`
- parser: OOXML zip/xml parser (no formula evaluation)
- aggregation month: `Create time` -> `YYYY-MM`
- bookings_count: unique `Refer` per month (fallback synthetic key if missing refer)
- gross_booking_value: sum of `Total Room` over deduplicated references per month
- channel_source: monthly summary from `Room` prefix (`OTA`/`Direct`)
- notes column includes raw row count and duplicate removals