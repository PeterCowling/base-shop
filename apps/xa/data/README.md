Type: Guide
Status: Active
Domain: XA
Last-reviewed: 2025-12-28

# XA catalog pipeline (CSV → JSON + Cloudflare Images)

This folder contains the CSV templates used by the XA catalog pipeline.

## Files
- `apps/xa/data/products.sample.csv`: products template (matches `apps/xa/src/data/catalog.json` shape).
- `apps/xa/data/products.simple.sample.csv`: single-file template for `--simple` mode (`image_files` + `image_alt_texts`).
- `apps/xa/data/images.sample.csv`: images template for bulk upload.
- `apps/xa/data/.env.xa`: optional env file for XA-only Cloudflare credentials (created by `pnpm xa:setup`).

## Quick start
1) Create `products.csv` and `images.csv` using the templates above.
2) (Optional) Create an XA-only env file: `pnpm xa:setup --env production` (or pass `--env-file`), then paste your Cloudflare account id + token.
3) Validate inputs locally.
4) Upload images to the XA Cloudflare account (returns a media map).
5) Build the catalog JSON consumed by the XA app.

```bash
pnpm xa:validate --products apps/xa/data/products.csv --images apps/xa/data/images.csv

XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:upload-images --images path/to/images.csv --out apps/xa/src/data/catalog.media.json

pnpm xa:import-catalog --products path/to/products.csv --images apps/xa/src/data/catalog.media.json
```

One-shot pipeline:
```bash
XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:sync-catalog --products path/to/products.csv --images path/to/images.csv
```

## Upload process (details)
This is the exact sequence used by the “sync” pipeline so reviewers can evaluate quality without repo access:
1) Read `products.csv` (product rows) and `images.csv` (image rows).
2) Preflight validation (recommended): checks required fields, numeric types, slug consistency, image files exist, and duplicates.
3) Image upload step:
   - Expands the `file` column (supports file paths, directories, and globs).
   - Resolves relative paths against the **directory containing `images.csv`** (unless `--base-dir` is set).
   - Uploads each file to Cloudflare Images using a generated opaque ID (no product metadata is sent).
   - Writes a local media map JSON (`apps/xa/src/data/catalog.media.json`) and optional resumable state file (`--state`).
4) Catalog import step:
   - Converts `products.csv` into `apps/xa/src/data/catalog.json`.
   - Applies media from the generated media map (or `media_paths` if you’re not using a media map).
   - In `--strict` mode, fails if required fields are missing and if any product has no images.

## Strict mode
Add `--strict` to enforce:
- required fields for new products (id, slug, description, created_at, deposit, stock, for_sale, for_rental, popularity),
- taxonomy fields required by the XA UI (always required): taxonomy_department, taxonomy_category, taxonomy_subcategory, taxonomy_color, taxonomy_material,
- every product has at least one image,
- media map entries must match known product slugs,
- conflicts like `brand_handle` vs `brand` (or `collection_handle` vs `collection`) fail instead of warning.
The uploader also checks that every image file is a non-empty file.

## Notes
- **Stealth / least leakage:** the XA pipeline only uploads image bytes to Cloudflare Images. Product metadata stays local as JSON in the repo. Upload filenames are randomized and IDs are opaque.
- **Field precedence:** `brand_handle` wins over `brand`; `collection_handle` wins over `collection`. In non-strict mode, conflicts emit warnings; in strict mode they fail.
- **Path resolution:** if `--base-dir` is omitted, image paths are resolved relative to the folder containing `images.csv` (or `products.csv` in `--simple` mode).
- **Globs & directories:** the `file` column supports globs like `images/shoes/*.jpg` and directory paths; use `--recursive` to scan directories recursively.
- **Resumable uploads:** pass `--state path/to/state.json`. The state now includes file hashes; if a file changes, re-run with `--replace` to re-upload and update IDs.
- **Keep state local:** the upload state file includes local file paths; it should not be committed (the repo ignores `apps/xa/data/.xa-upload-state*.json`).
- `media_paths` values are Cloudflare Image IDs (optionally `id/variant`).

## Simple mode (single CSV)
If you prefer to maintain a single CSV, you can embed local image specs in `products.csv` and let the pipeline derive an internal `images.csv` automatically:
- Add columns:
  - `image_files`: pipe-separated file specs (paths, globs, or directories)
  - `image_alt_texts`: optional pipe-separated alt text (same count as `image_files`)

Run:
```bash
XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:sync-catalog --products path/to/products.csv --simple
```

## Common workflows
- **Update product details only:** `pnpm xa:import-catalog --products products.csv --merge --backup`
- **Replace changed images:** `pnpm xa:upload-images --images images.csv --state .xa-state.json --replace`
- **Export current catalog to CSV:** `pnpm xa:export-csvs --products-out products.export.csv --media-out media.export.csv`
- **Scaffold CSVs from an image folder:** `pnpm xa:generate-csvs --images-root /path/to/images`
- **Merge products+images into a single CSV:** `pnpm xa:merge-csvs --products products.csv --images images.csv --out products.with-images.csv`