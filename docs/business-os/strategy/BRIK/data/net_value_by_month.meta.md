# net_value_by_month.csv provenance

- derived from `bookings_by_month.csv` values produced from `export_19519177.xls`.
- user confirmed source export is net of cancellations, so values are treated as net booking value.
- aggregation month: `Create time` -> `YYYY-MM`.
- deduplication basis: unique `Refer` per month (fallback synthetic key if missing).