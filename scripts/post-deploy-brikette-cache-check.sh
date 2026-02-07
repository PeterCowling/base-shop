#!/bin/sh
# Brikette post-deploy cache header contract check (Cloudflare Pages)
#
# Usage:
#   ./scripts/post-deploy-brikette-cache-check.sh <project-name>
#   ./scripts/post-deploy-brikette-cache-check.sh <project-name> --staging
#   BASE_URL="https://www.hostel-positano.com" ./scripts/post-deploy-brikette-cache-check.sh
#
# Exits 0 if all header contracts pass, 1 otherwise.

set -e

PROJECT_NAME="${1:-}"
STAGING="${2:-}"

if [ -n "${BASE_URL:-}" ]; then
  URL="$BASE_URL"
elif [ -z "$PROJECT_NAME" ]; then
  echo "Usage: $0 <project-name> [--staging]"
  echo "       BASE_URL=<url> $0"
  exit 1
elif [ "$STAGING" = "--staging" ]; then
  URL="https://staging.${PROJECT_NAME}.pages.dev"
else
  URL="https://${PROJECT_NAME}.pages.dev"
fi

echo "========================================"
echo "  Brikette Cache Headers Check"
echo "  URL: $URL"
echo "========================================"

fetch_headers() {
  curl -sS -D - -o /dev/null -I "$1" 2>/dev/null | tr -d '\r'
}

header_value() {
  # header_value <headers> <header-name>
  # Prints first matching header value (case-insensitive) or empty string.
  printf "%s" "$1" | awk -F':' -v name="$2" '
    function trim(s) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", s); return s }
    {
      key = trim($1)
      if (tolower(key) == tolower(name)) {
        sub(/^[^:]+:[[:space:]]*/, "", $0)
        print $0
        exit
      }
    }
  '
}

must_contain() {
  value="$1"
  needle="$2"
  label="$3"
  case "$value" in
    *"$needle"*) return 0 ;;
    *)
      echo "FAIL: $label expected to contain '$needle' but was: $value"
      return 1
      ;;
  esac
}

must_equal() {
  value="$1"
  expected="$2"
  label="$3"
  if [ "$value" = "$expected" ]; then
    return 0
  fi
  echo "FAIL: $label expected '$expected' but was: $value"
  return 1
}

must_be_cacheable_at_edge() {
  # must_be_cacheable_at_edge <url> <label>
  # Checks:
  # - Cache-Control contains s-maxage (signal we intend edge caching)
  # - cf-cache-status is not DYNAMIC/BYPASS across 3 requests
  # - at least one of the last two requests is HIT or REVALIDATED
  url="$1"
  label="$2"

  h1="$(fetch_headers "$url")"
  h2="$(fetch_headers "$url")"
  h3="$(fetch_headers "$url")"

  cc="$(header_value "$h1" "Cache-Control")"
  must_contain "$cc" "s-maxage=" "$label cache-control"

  s2="$(header_value "$h2" "cf-cache-status")"
  s3="$(header_value "$h3" "cf-cache-status")"

  for s in "$s2" "$s3"; do
    case "$s" in
      DYNAMIC|BYPASS|"")
        echo "FAIL: $label expected cf-cache-status not DYNAMIC/BYPASS but was: $s"
        return 1
        ;;
    esac
  done

  case "$s2,$s3" in
    *HIT*|*REVALIDATED*) return 0 ;;
    *)
      echo "FAIL: $label expected cf-cache-status HIT/REVALIDATED on repeat requests, got: $s2 then $s3"
      return 1
      ;;
  esac
}

must_not_be_cached() {
  # must_not_be_cached <url> <label>
  url="$1"
  label="$2"
  h="$(fetch_headers "$url")"
  cc="$(header_value "$h" "Cache-Control")"
  must_equal "$cc" "no-store" "$label cache-control"

  # For safety: ensure it's not being edge-cached.
  s="$(header_value "$h" "cf-cache-status")"
  case "$s" in
    HIT|REVALIDATED)
      echo "FAIL: $label expected NOT cached, but cf-cache-status was: $s"
      return 1
      ;;
  esac
}

must_have_immutable_static_assets() {
  html_url="$1"
  label="$2"

  html="$(curl -sS "$html_url" 2>/dev/null || true)"
  asset_path="$(printf "%s" "$html" | grep -Eo '/_next/static/[^\" ]+\\.js' | head -n 1 || true)"
  if [ -z "$asset_path" ]; then
    echo "FAIL: $label could not find a /_next/static/*.js asset in HTML (is this a Next build?)"
    return 1
  fi

  asset_url="${URL}${asset_path}"
  h="$(fetch_headers "$asset_url")"
  cc="$(header_value "$h" "Cache-Control")"
  must_contain "$cc" "immutable" "$label asset cache-control"
}

must_not_set_cookie() {
  url="$1"
  label="$2"
  h="$(fetch_headers "$url")"
  sc="$(header_value "$h" "Set-Cookie")"
  if [ -n "$sc" ]; then
    echo "FAIL: $label should not set cookies, but Set-Cookie was present"
    return 1
  fi
}

HOME_URL="${URL}/en/"
RATES_URL="${URL}/data/rates.json"
EXPERIENCES_URL="${URL}/en/experiences"
BOOK_URL="${URL}/en/book"

echo ""
echo "> Cacheable HTML..."
must_be_cacheable_at_edge "$HOME_URL" "home"
must_not_set_cookie "$EXPERIENCES_URL" "experiences"
must_be_cacheable_at_edge "$EXPERIENCES_URL" "experiences"

echo ""
echo "> Cacheable JSON..."
must_be_cacheable_at_edge "$RATES_URL" "rates.json"

echo ""
echo "> Non-cacheable booking..."
must_not_be_cached "$BOOK_URL" "booking"

echo ""
echo "> Immutable static assets..."
must_have_immutable_static_assets "$HOME_URL" "home"

echo ""
echo "========================================"
echo "OK: Brikette cache header contracts passed"
echo "========================================"
