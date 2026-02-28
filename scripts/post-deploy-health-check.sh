#!/bin/sh
# Post-deploy health check — run after Cloudflare Pages deploy
#
# Usage:
#   ./scripts/post-deploy-health-check.sh <project-name>
#   ./scripts/post-deploy-health-check.sh <project-name> --staging
#   BASE_URL="https://custom.domain.com" ./scripts/post-deploy-health-check.sh
#   EXTRA_ROUTES="/api/health /shop" ./scripts/post-deploy-health-check.sh <project-name>
#   STRICT_ROUTES="/it/prenota" ./scripts/post-deploy-health-check.sh <project-name>
#
# Environment variables:
#   BASE_URL          - Override the deployed URL (useful for custom domains or preview URLs)
#   EXTRA_ROUTES      - Space-separated list of routes to check (e.g., "/api/health /shop")
#                       Uses redirect-following curl (2xx and 3xx = pass).
#   STRICT_ROUTES     - Space-separated list of routes that must return HTTP 200 exactly,
#                       with no redirect following. Use for Cloudflare Pages 200-rewrite
#                       routes where a 301 redirect indicates a broken route.
#   MAX_RETRIES       - Number of retry attempts (default: 10)
#   RETRY_DELAY       - Seconds between retries (default: 6)
#
# Exits 0 if all checks pass, 1 if any fail.
# Designed to be called from GitHub Actions after wrangler pages deploy.

set -e

PROJECT_NAME="${1:-}"
STAGING="${2:-}"
EXTRA_ROUTES="${EXTRA_ROUTES:-}"
STRICT_ROUTES="${STRICT_ROUTES:-}"
MAX_RETRIES="${MAX_RETRIES:-10}"
RETRY_DELAY="${RETRY_DELAY:-6}"

# Determine URL (BASE_URL override > staging flag > production default)
if [ -n "$BASE_URL" ]; then
    URL="$BASE_URL"
elif [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name> [--staging]"
    echo "       BASE_URL=<url> $0"
    echo ""
    echo "Examples:"
    echo "  $0 cms --staging"
    echo "  BASE_URL=https://abc123.cms.pages.dev $0"
    exit 1
elif [ "$STAGING" = "--staging" ]; then
    # Note: Cloudflare Pages staging URLs vary by setup
    # Override with BASE_URL if your pattern differs
    URL="https://staging.${PROJECT_NAME}.pages.dev"
else
    URL="https://${PROJECT_NAME}.pages.dev"
fi

echo "========================================"
echo "  Post-Deploy Health Check"
echo "  URL: $URL"
echo "  Max retries: $MAX_RETRIES (${RETRY_DELAY}s delay)"
echo "========================================"

# check_url <url> - returns 0 if 2xx/3xx, 1 otherwise
# Uses -L to follow redirects; accepts 2xx and 3xx as success
check_url() {
    CHECK_URL="$1"
    # -L: follow redirects
    # -w: output final status code
    # -o /dev/null: discard body
    STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    case "$STATUS" in
        2*|3*) return 0 ;;  # 2xx and 3xx are success
        *)
            echo "$STATUS"
            return 1
            ;;
    esac
}

# check_url_strict <url> - returns 0 only if HTTP 200, 1 otherwise
# Does NOT follow redirects (--max-redirect 0). Use for routes that should be
# served as Cloudflare Pages 200-rewrites (transparent proxy). A 301 redirect
# indicates the route is broken and must be reported as failure.
check_url_strict() {
    CHECK_URL="$1"
    STATUS=$(curl -sI --max-redirect 0 -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    case "$STATUS" in
        200) return 0 ;;  # Only HTTP 200 is success for strict routes
        *)
            echo "$STATUS"
            return 1
            ;;
    esac
}

# retry_check_strict <url> - retries with backoff until 200 or max retries
retry_check_strict() {
    CHECK_URL="$1"
    ATTEMPT=1
    LAST_STATUS=""
    while [ "$ATTEMPT" -le "$MAX_RETRIES" ]; do
        echo "  Attempt $ATTEMPT/$MAX_RETRIES (strict)..."
        if LAST_STATUS=$(check_url_strict "$CHECK_URL" 2>&1); then
            FINAL_STATUS=$(curl -sI --max-redirect 0 -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "???")
            echo "  OK (strict): $CHECK_URL returned $FINAL_STATUS"
            return 0
        else
            if [ "$ATTEMPT" -lt "$MAX_RETRIES" ]; then
                echo "  Got $LAST_STATUS (expected 200), retrying in ${RETRY_DELAY}s..."
                sleep "$RETRY_DELAY"
            fi
        fi
        ATTEMPT=$((ATTEMPT + 1))
    done
    FINAL_STATUS=$(curl -sI --max-redirect 0 -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    echo "  FAIL (strict): $CHECK_URL returned $FINAL_STATUS after $MAX_RETRIES attempts (expected 200)"
    return 1
}

# retry_check <url> - retries with backoff until success or max retries
retry_check() {
    CHECK_URL="$1"
    ATTEMPT=1
    LAST_STATUS=""
    while [ "$ATTEMPT" -le "$MAX_RETRIES" ]; do
        echo "  Attempt $ATTEMPT/$MAX_RETRIES..."
        # check_url echoes status on failure, capture it
        if LAST_STATUS=$(check_url "$CHECK_URL" 2>&1); then
            # Get actual final status for logging
            FINAL_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "???")
            echo "  OK: $CHECK_URL returned $FINAL_STATUS"
            return 0
        else
            if [ "$ATTEMPT" -lt "$MAX_RETRIES" ]; then
                echo "  Got $LAST_STATUS, retrying in ${RETRY_DELAY}s..."
                sleep "$RETRY_DELAY"
            fi
        fi
        ATTEMPT=$((ATTEMPT + 1))
    done
    # Final attempt failed - get fresh status
    FINAL_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    echo "  FAIL: $CHECK_URL returned $FINAL_STATUS after $MAX_RETRIES attempts"
    return 1
}

# Check homepage with retry
echo ""
echo "> Checking homepage..."
if ! retry_check "$URL"; then
    exit 1
fi

# Check additional routes if specified
if [ -n "$EXTRA_ROUTES" ]; then
    echo ""
    echo "> Checking additional routes..."
    for route in $EXTRA_ROUTES; do
        ROUTE_URL="${URL}${route}"
        echo "  Route: $route"
        if ! retry_check "$ROUTE_URL"; then
            exit 1
        fi
    done
fi

# Check strict routes if specified (must return HTTP 200 — no redirect following)
if [ -n "$STRICT_ROUTES" ]; then
    echo ""
    echo "> Checking strict routes (must return HTTP 200, no redirect)..."
    for route in $STRICT_ROUTES; do
        ROUTE_URL="${URL}${route}"
        echo "  Route: $route"
        if ! retry_check_strict "$ROUTE_URL"; then
            exit 1
        fi
    done
fi

echo ""
echo "========================================"
echo "OK: All health checks passed"
echo "========================================"
