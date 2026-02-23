# HBAG WEBSITE-02 Performance Evidence (TASK-06)

Date: 2026-02-23

## Measurement Contract

| Metric | Threshold | Method |
|---|---:|---|
| Launch media completeness pass rate | 100% active SKUs pass | `pnpm --filter @apps/caryina validate:launch-media` |
| Root client JS gzip payload | <= 120000 bytes | sum gzip bytes for `build-manifest.json` `rootMainFiles` |
| Production build stability | build exits 0 and prerenders all static routes | `pnpm --filter @apps/caryina build` |

## Results

| Metric | Result | Verdict |
|---|---:|---|
| Launch media completeness pass rate | 3/3 active SKUs | Pass |
| Root client JS gzip payload | 115668 bytes | Pass |
| Production build stability | exit 0, 13/13 static pages generated | Pass |

## Supporting Command Outputs

- `pnpm --filter @apps/caryina validate:launch-media`
  - `PASS launch-media-contract: 3/3 SKUs valid`
- `pnpm --filter @apps/caryina build`
  - `Compiled successfully in 120s`
  - `Generating static pages ... 13/13`
- Root JS gzip computation (from `.next/build-manifest.json`):
  - `static/chunks/webpack-f3892bba8bc2b8f2.js` -> 1632 bytes gzip
  - `static/chunks/2737b92b-db58ea03a7e3c805.js` -> 62316 bytes gzip
  - `static/chunks/508-3938ca9853248be7.js` -> 51498 bytes gzip
  - `static/chunks/main-app-64bc1c884892a01f.js` -> 222 bytes gzip

## Notes

- A deterministic fail path is also verified using fixture:
  - `pnpm --filter @apps/caryina validate:launch-media --file ../../docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json`
  - Result: expected fail with `missing required slot \`on_body\``.
