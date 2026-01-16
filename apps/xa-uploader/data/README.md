Type: Guide
Status: Active
Domain: XA
Last-reviewed: 2025-12-28

# XA catalog pipeline (CSV → JSON + Cloudflare Images)

This folder contains the CSV templates used by the XA catalog pipeline.

## Storefront catalogs
XA now ships three storefronts:
- XA-C (clothes) → `apps/xa`
- XA-B (bags) → `apps/xa-b`
- XA-J (jewelry) → `apps/xa-j`

## Files
- `apps/xa-uploader/data/products.xa-c.csv`: XA-C product drafts (legacy `products.csv` still supported).
- `apps/xa-uploader/data/products.xa-b.csv`: XA-B product drafts.
- `apps/xa-uploader/data/products.xa-j.csv`: XA-J product drafts.
- `apps/xa-uploader/data/products.sample.csv`: products template (matches `apps/xa/src/data/catalog.json` shape).
- `apps/xa-uploader/data/products.simple.sample.csv`: single-file template for `--simple` mode (`image_files` + `image_alt_texts`).
- `apps/xa-uploader/data/images.sample.csv`: images template for bulk upload.
- `apps/xa-uploader/data/.env.xa`: optional env file for XA-only Cloudflare credentials (created by `pnpm xa:setup`).

## Quick start
1) Create `products.xa-*.csv` (or legacy `products.csv` for XA-C) and `images.csv` using the templates above.
2) (Optional) Create an XA-only env file: `pnpm xa:setup --env production` (or pass `--env-file`), then paste your Cloudflare account id + token.
3) Validate inputs locally.
4) Upload images to the XA Cloudflare account (returns a media map).
5) Build the catalog JSON consumed by the XA app.

```bash
pnpm xa:validate --products apps/xa-uploader/data/products.csv --images apps/xa-uploader/data/images.csv

XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:upload-images --images path/to/images.csv --out apps/xa/src/data/catalog.media.json

pnpm xa:import-catalog --products path/to/products.csv --images apps/xa/src/data/catalog.media.json
```

Replace `apps/xa` with `apps/xa-b` or `apps/xa-j` when targeting those storefronts.

One-shot pipeline:
```bash
XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:sync-catalog --products path/to/products.csv --images path/to/images.csv
```

## Uploader console access (token)
When running the uploader UI in **internal mode** (default), you must enter the console token:
- Env var: `XA_UPLOADER_ADMIN_TOKEN`
- In development, the app falls back to: `dev-xa-uploader-admin-token-32-chars!!`

In production you must set:
- `XA_UPLOADER_ADMIN_TOKEN` (≥32 chars, unique per environment)
- `XA_UPLOADER_SESSION_SECRET` (≥32 chars)

## Vendor submissions (ZIP handoff, 1–10 products)
If a third party should **not** have any Cloudflare credentials (or any link to your stack), they can work entirely offline and hand you a single ZIP.

### Vendor workflow (no credentials)
1) Run the local uploader console in **vendor mode** (disables sync + token requirement):

```bash
XA_UPLOADER_MODE=vendor NEXT_PUBLIC_XA_UPLOADER_MODE=vendor pnpm --filter @apps/xa-uploader dev
```

Optional placeholders:
- `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` (display-only hint, e.g. `r2://xa-submissions/submissions/`)
- `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` (prefill the upload URL input, typically a one-time presigned link)

2) Create/edit up to 10 products (including `image_files` pointing to local image paths/globs).
3) Tick the checkbox next to each product to include in a submission (max 10).
4) (Recommended) Paste the one-time **upload link** you were given and click **Upload submission**.
5) If you can’t upload directly, click **Export ZIP** to download `submission.<date>.<id>.zip` and upload it manually to the file-drop.

Notes:
- This console must run on the same machine that has the image files (the packager reads paths/globs from the local filesystem).
- The ZIP contains `products.csv`, `manifest.json`, and `images/<slug>/...` with **randomized filenames**.
- The exporter rewrites `image_files` to point at the packaged images, so your internal pipeline never sees vendor filesystem paths.
- The exporter rejects large submissions (currently ~250MB of image bytes).
- The exporter rejects unsupported or undersized images (JPG/PNG/WebP only; minimum shortest edge defaults to 1600px). Override via `XA_UPLOADER_MIN_IMAGE_EDGE` / `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE`.

### Coordinator workflow (issue one-time upload links)
Set drop config in `apps/xa-uploader/data/.env.xa` (or pass `--env-file`):
- `XA_DROP_BASE_URL` (your upload domain, e.g. `https://drop.example.com`)
- `XA_DROP_UPLOAD_SECRET` (>=32 chars, must match the worker `UPLOAD_TOKEN_SECRET`)
- (optional) `XA_R2_PREFIX=submissions/` (used for internal key naming)

Generate a one-time upload URL (share it with the vendor):
```bash
pnpm xa:drop:issue-upload-url --env production
```

Batch (pre-issue multiple one-time links):
```bash
pnpm xa:drop:issue-upload-url --count 25 --env production
```

### Internal workflow (ingest + process)
1) Download the ZIP.
2) Ingest + process (validates, uploads images, merges into the XA catalog):

```bash
XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:ingest-submission --zip /path/to/submission.zip
```

Multiple submissions:
```bash
XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \
pnpm xa:ingest-submission --dir /path/to/submissions
```

### Internal workflow (ingest directly from R2)
Downloads any new `.zip` objects under the submissions prefix, runs `xa:ingest-submission`, and records processed keys in `apps/xa-uploader/data/inbox/.xa-r2-processed.json`.

```bash
pnpm xa:r2:ingest --env production
```

Defaults:
- Enforces 1–10 products per ZIP.
- Extracts to `apps/xa-uploader/data/inbox/` (or `--dest` to override).
- Runs `xa:validate` and then `xa:sync-catalog --simple --merge --backup`.

## Upload process (details)
This is the exact sequence used by the “sync” pipeline so reviewers can evaluate quality without repo access:
1) Read `products.csv` (product rows) and `images.csv` (image rows).
2) Preflight validation (recommended): checks required fields, numeric types, slug consistency, image files exist, and duplicates.
3) Image upload step:
   - Expands the `file` column (supports file paths, directories, and globs).
   - Resolves relative paths against the **directory containing `images.csv`** (unless `--base-dir` is set).
   - Uploads each file to Cloudflare Images using a generated opaque ID (no product metadata is sent).
   - Enforces minimum image dimensions (shortest edge defaults to 1600px; set `--min-image-edge <px>` to override).
   - Writes a local media map JSON (`apps/<storefront>/src/data/catalog.media.json`) and optional resumable state file (`--state`).
4) Catalog import step:
   - Converts `products.csv` into `apps/<storefront>/src/data/catalog.json`.
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
- **Keep state local:** the upload state file includes local file paths; it should not be committed (the repo ignores `apps/xa-uploader/data/.xa-upload-state*.json`).
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
