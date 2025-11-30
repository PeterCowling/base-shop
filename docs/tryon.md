# Try‑On System Overview

This document describes the edge‑only try‑on pipeline, environment, routes, and UI controller used by the shop app.

## Stages

- Stage 0 – Foundations: env schema, R2 binding, CSP, provider skeletons.
- Stage 1 – Direct‑to‑R2 Uploads: presign URL route, client pre‑resize, XHR PUT with progress.
- Stage 2 – Accessory Overlay Preview: edge segment/depth, fallback shadow, controller state.
- Stage 3 – Garment Enhance (SSE): edge proxy with idempotency + progress stream.
- Stage 4 – Guardrails: circuit breaker, quotas, KV idempotency index.
- Stage 5 – Optional AR: render `<model-viewer>` when assets exist.

## Environment

Required for uploads:

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_BUCKET_TRYON`
- `R2_PUBLIC_BASE_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `TRYON_UPLOAD_ENABLE_PUT` (optional, default: false) — set to `true` if you must support legacy PUT uploads in addition to POST.
- `TRYON_REQUIRE_DIMENSIONS` (optional) — set to `true` to require client‑reported `width`/`height` for uploads.

Workers AI (segment/depth):

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_AI_GATEWAY_ID`

Heavy generator (SSE upstream, optional):

- `TRYON_HEAVY_API_URL`

Optional KV for idempotency/quotas:

- Wrangler `[[kv_namespaces]]` with `binding = "TRYON_KV"`

## Routes (all `runtime = 'edge'`)

- `POST /api/uploads/direct` → presigned POST (default) or legacy PUT (if enabled). Body: `{ contentType, idempotencyKey, filename?, width?, height?, sizeBytes? }`.
- `POST /api/ai/segment|depth|pose` → provider calls; `{ imageUrl, idempotencyKey }`. Returns URLs (often data URLs).
- `POST /api/tryon/garment` → SSE: ack, preprocess, compose, enhance ticks, final. Requires `Idempotency-Key` header.

Quotas: 20 previews/day, 5 enhances/day per uid/IP (KV persisted when available).

## Sequence (Stage 1 → 3)

```text
Client             Edge Upload         R2            Edge AI            Upstream (optional)
  |  Select file      |                                |                          |
  |  Resize canvas    |                                |                          |
  |--/uploads/direct->|                                |                          |
  |<-uploadUrl,key----|                                |                          |
  |--PUT blob (XHR)--------------------->|             |                          |
  |                              objectUrl             |                          |
  |--/ai/segment|depth (imageUrl)------->|--provider-->|                          |
  |<---------- maskUrl/depthUrl ---------|             |                          |
  |  Compose preview (shadow fallback)   |             |                          |
  |--/tryon/garment (SSE)--------------->|                           --proxy-->    |
  |<--ack,progress,final-----------------|             |             <---SSE------|
```

## Controller

Hook: `packages/ui/src/hooks/tryon/useTryOnController.ts`

- `startUpload(file)` → generates jobId, uploads via presign, stores `sourceImageUrl`.
- `preprocess({ imageUrl, jobId })` → calls segment/depth routes.
- `enhance(payload)` → connects to SSE and dispatches progress/final.

State phases: `idle → uploading → preprocessed → preview → enhancing → done|failed`.

## Security & CSP

- No large bodies through Next: client uploads directly to R2 S3 endpoint via presigned POST (preferred).
- CSP `connect-src` allows Workers AI, AI Gateway, R2 public origin, and the S3 endpoint.
- `script-src` includes `https://unpkg.com` for `<model-viewer>` loader.
  - Prefer self‑hosting model‑viewer and set `NEXT_PUBLIC_MODEL_VIEWER_SRC` to the self origin to avoid CDN allowlists.
- `frame-ancestors 'none'`. `Permissions-Policy`: camera/microphone/geolocation/gyroscope disabled.

## R2 CORS & Bucket Policy (recommended)

When using POST uploads and signed GET for viewing, configure the try‑on bucket as private and set CORS to allow only the site origin for POST/GET:

```
AllowedOrigins: ["https://your.site"],
AllowedMethods: ["GET","POST"],
AllowedHeaders: ["*"],
MaxAgeSeconds: 300
```

Keep objects under a keyed prefix `tryon/<uid>/...` and serve previews via `/api/r2/sign-get?key=<path>` (short TTL). Avoid exposing permanent public URLs.

## Operations

- Logs: routes log `{ jobId, ms, ok }`, redact URLs; only hostnames are logged.
- Idempotency index: KV `idem:<Idempotency-Key>` → final URL with 24h TTL.
- Quotas: KV counters `quota:preview:<uid>:<day>`, in-memory fallback.

## Dev tips

- Use data URLs for masks/depth to avoid persistence in preview.
- For AR, ensure `assets3d.glb`/`usdz` is set in `apps/cover-me-pretty/src/lib/tryonMeta.ts`.
- To disable provider calls, set `TRYON_PROVIDER` to something else; routes will return `{}` and the UI degrades gracefully.
