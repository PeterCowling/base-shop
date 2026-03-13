---
Type: Reference
Status: Active
Domain: Repo
Last-reviewed: 2026-03-11
---

# Dev Ports

Canonical localhost port assignments for repo apps. Keep ports unique. Regenerate/check via `pnpm --filter scripts validate-dev-ports -- --write-doc`.

| App | Package | Port | Sources |
| --- | --- | ---: | --- |
| `apps/cover-me-pretty` | `@apps/cover-me-pretty` | `3004` | package.json script "dev" (apps/cover-me-pretty/package.json)<br>package.json script "start" (apps/cover-me-pretty/package.json) |
| `apps/cms` | `@apps/cms` | `3006` | package.json script "dev" (apps/cms/package.json)<br>package.json script "start" (apps/cms/package.json) |
| `apps/skylar` | `@apps/skylar` | `3008` | package.json script "dev" (apps/skylar/package.json)<br>package.json script "start" (apps/skylar/package.json) |
| `apps/cochlearfit` | `@apps/cochlearfit` | `3011` | package.json script "dev" (apps/cochlearfit/package.json)<br>package.json script "start" (apps/cochlearfit/package.json) |
| `apps/brikette` | `@apps/brikette` | `3012` | package.json script "dev" (apps/brikette/package.json)<br>package.json script "start" (apps/brikette/package.json) |
| `apps/xa-b` | `@apps/xa-b` | `3013` | package.json script "dev" (apps/xa-b/package.json)<br>package.json script "start" (apps/xa-b/package.json) |
| `apps/product-pipeline` | `@apps/product-pipeline` | `3014` | package.json script "dev" (apps/product-pipeline/package.json)<br>package.json script "start" (apps/product-pipeline/package.json) |
| `apps/prime` | `@apps/prime` | `3015` | package.json script "dev" (apps/prime/package.json)<br>package.json script "start" (apps/prime/package.json) |
| `apps/handbag-configurator` | `@apps/handbag-configurator` | `3016` | package.json script "dev" (apps/handbag-configurator/package.json)<br>package.json script "start" (apps/handbag-configurator/package.json) |
| `apps/handbag-configurator-api` | `@apps/handbag-configurator-api` | `3017` | src/server.ts (apps/handbag-configurator-api/src/server.ts) |
| `apps/caryina` | `@apps/caryina` | `3018` | package.json script "dev" (apps/caryina/package.json)<br>package.json script "start" (apps/caryina/package.json) |
| `apps/xa-uploader` | `@apps/xa-uploader` | `3020` | package.json script "dev" (apps/xa-uploader/package.json)<br>package.json script "start" (apps/xa-uploader/package.json) |
| `apps/inventory-uploader` | `@acme/inventory-uploader` | `3021` | package.json script "dev" (apps/inventory-uploader/package.json)<br>package.json script "start" (apps/inventory-uploader/package.json) |
| `apps/business-os` | `@apps/business-os` | `3022` | package.json script "dev" (apps/business-os/package.json)<br>package.json script "start" (apps/business-os/package.json) |
| `apps/reception` | `@apps/reception` | `3023` | package.json script "dev" (apps/reception/package.json)<br>package.json script "start" (apps/reception/package.json) |
| `apps/payment-manager` | `@acme/payment-manager` | `3025` | package.json script "dev" (apps/payment-manager/package.json)<br>package.json script "start" (apps/payment-manager/package.json) |
| `apps/storybook` | `@apps/storybook` | `6006` | package.json script "dev" (apps/storybook/package.json) |
| `apps/cochlearfit-worker` | `@apps/cochlearfit-worker` | `8788` | package.json script "dev" (apps/cochlearfit-worker/package.json) |
| `apps/product-pipeline-queue-worker` | `@apps/product-pipeline-queue-worker` | `8789` | package.json script "dev" (apps/product-pipeline-queue-worker/package.json) |
| `apps/xa-drop-worker` | `@apps/xa-drop-worker` | `8792` | package.json script "dev" (apps/xa-drop-worker/package.json) |
