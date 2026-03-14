#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
app_dir="$repo_root/apps/brikette"
tmp_dir="$app_dir/.tmp"

restore_routes() {
  [[ -d "$tmp_dir/app-api-off" ]] && mv "$tmp_dir/app-api-off" "$app_dir/src/app/api"
  [[ -d "$app_dir/src/app/[lang]/guides/_slug-off" ]] && mv "$app_dir/src/app/[lang]/guides/_slug-off" "$app_dir/src/app/[lang]/guides/[...slug]"
  [[ -d "$app_dir/src/app/[lang]/guides/_single-off" ]] && mv "$app_dir/src/app/[lang]/guides/_single-off" "$app_dir/src/app/[lang]/guides/[slug]"
  [[ -d "$app_dir/src/app/[lang]/help/_slug-off" ]] && mv "$app_dir/src/app/[lang]/help/_slug-off" "$app_dir/src/app/[lang]/help/[slug]"
}

trap restore_routes EXIT

cd "$repo_root"
pnpm exec turbo run build --filter=@apps/brikette^...

cd "$app_dir"
mkdir -p "$tmp_dir"

[[ -d "src/app/[lang]/guides/[...slug]" ]] && mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off"
[[ -d "src/app/[lang]/guides/[slug]" ]] && mv "src/app/[lang]/guides/[slug]" "src/app/[lang]/guides/_single-off"
[[ -d "src/app/[lang]/help/[slug]" ]] && mv "src/app/[lang]/help/[slug]" "src/app/[lang]/help/_slug-off"
[[ -d "src/app/api" ]] && mv "src/app/api" "$tmp_dir/app-api-off"

export OUTPUT_EXPORT=1
export NEXT_PUBLIC_OUTPUT_EXPORT=1

if [[ -n "${BRIKETTE_BUILD_LANGS:-}" ]]; then
  export BRIKETTE_STAGING_LANGS="$BRIKETTE_BUILD_LANGS"
  export NEXT_PUBLIC_BRIKETTE_BUILD_LANGS="$BRIKETTE_BUILD_LANGS"
fi

if [[ -n "${BRIKETTE_GA_MEASUREMENT_ID:-}" ]]; then
  export NEXT_PUBLIC_GA_MEASUREMENT_ID="$BRIKETTE_GA_MEASUREMENT_ID"
fi

if [[ "${BRIKETTE_ENABLE_LIVE_AVAILABILITY:-0}" == "1" ]]; then
  export NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1
fi

pnpm build
pnpm normalize:localized-routes
pnpm generate:static-redirects

if [[ "${BRIKETTE_SKIP_EXPORT_VERIFY:-0}" != "1" ]]; then
  pnpm verify:sitemap-contract -- --file out/sitemap.xml
  pnpm verify:rendered-link-canonicals -- --out-dir out
  pnpm verify:localized-commercial-copy -- --out-dir out
fi

find out -name "__next.*" -type f -delete
