#!/bin/sh
# Deploy Environment Gate — Fail fast on missing or placeholder secrets
#
# This script validates that all deploy-required environment variables
# are present and not placeholder values before deployment.
#
# Usage:
#   ./scripts/validate-deploy-env.sh                     # Validate current env
#   ./scripts/validate-deploy-env.sh apps/cms/.env       # Validate specific file
#   ENV_FILE=apps/cms/.env ./scripts/validate-deploy-env.sh
#   DRY_RUN=1 ./scripts/validate-deploy-env.sh           # Show what would be checked
#
# Exit codes:
#   0 - All required variables are present and valid
#   1 - One or more required variables are missing or placeholder
#   2 - Script error (file not found, etc.)
#
# This script is part of SEC-02 in the Integrated Secrets Workflow Plan.
# See: docs/plans/integrated-secrets-workflow-plan.md
#
# The source of truth for required variables is:
#   packages/config/env-schema.ts
#
# IMPORTANT: This script is NON-LEAKY — it never prints secret values,
# only variable names and failure reasons.

set -e

# Colors for output (disable if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

DRY_RUN="${DRY_RUN:-0}"
ENV_FILE="${ENV_FILE:-${1:-}}"

# Placeholder patterns to reject
# Values starting with these are considered invalid for deploy
PLACEHOLDER_PATTERNS="TODO_ __REPLACE_ME__ placeholder CHANGEME"

echo "========================================"
echo "  Deploy Environment Gate"
echo "========================================"
echo ""

# =============================================================================
# Deploy-required variables (from packages/config/env-schema.ts)
# =============================================================================
# These are the variables marked as required: "deploy" in the schema.
# They are grouped by category for clarity.

# Auth secrets (always required in production)
AUTH_REQUIRED="NEXTAUTH_SECRET SESSION_SECRET CART_COOKIE_SECRET"

# Payments (required when PAYMENTS_PROVIDER=stripe)
PAYMENTS_REQUIRED="STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET"

# Deployment (required for Cloudflare Pages deploy)
DEPLOY_REQUIRED="CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN"

# Conditional: Redis (required when SESSION_STORE_PROVIDER=redis)
REDIS_REQUIRED="UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN"

# Conditional: Email (required when EMAIL_PROVIDER is set)
EMAIL_REQUIRED="EMAIL_FROM"

# Conditional: SendGrid (required when EMAIL_PROVIDER=sendgrid)
SENDGRID_REQUIRED="SENDGRID_API_KEY"

# Conditional: Resend (required when EMAIL_PROVIDER=resend)
RESEND_REQUIRED="RESEND_API_KEY"

# Conditional: Sanity CMS (required when using Sanity)
SANITY_REQUIRED="SANITY_PROJECT_ID SANITY_DATASET"

# =============================================================================
# Helper functions
# =============================================================================

# Load env file if specified
load_env_file() {
    if [ -n "$ENV_FILE" ]; then
        if [ ! -f "$ENV_FILE" ]; then
            echo "${RED}ERROR: Environment file not found: $ENV_FILE${NC}"
            exit 2
        fi
        echo "${BLUE}Loading:${NC} $ENV_FILE"
        # Export all variables from the file
        set -a
        # shellcheck source=/dev/null
        . "$ENV_FILE"
        set +a
    else
        echo "${BLUE}Source:${NC} Current environment (process.env)"
    fi
    echo ""
}

# Check if a value is a placeholder
is_placeholder() {
    value="$1"

    # Empty or unset is a placeholder
    if [ -z "$value" ]; then
        return 0
    fi

    # Check against known placeholder patterns
    for pattern in $PLACEHOLDER_PATTERNS; do
        case "$value" in
            ${pattern}*)
                return 0
                ;;
        esac
    done

    # Check for common placeholder patterns (case-insensitive for some)
    case "$value" in
        xxx*|XXX*|your_*|YOUR_*|changeme*|CHANGEME*|replace_*|REPLACE_*)
            return 0
            ;;
    esac

    return 1
}

# Get the value of an environment variable by name
get_env_value() {
    eval "echo \"\${$1:-}\""
}

# Check a list of variables, return count of failures
check_vars() {
    var_list="$1"
    category="$2"
    is_conditional="${3:-0}"
    condition_met="${4:-1}"

    if [ "$condition_met" = "0" ]; then
        echo "${YELLOW}SKIP:${NC} $category (condition not met)"
        return 0
    fi

    failures=0
    for var in $var_list; do
        value=$(get_env_value "$var")

        if [ "$DRY_RUN" = "1" ]; then
            echo "  Would check: $var"
            continue
        fi

        if is_placeholder "$value"; then
            if [ -z "$value" ]; then
                echo "${RED}FAIL:${NC} $var — missing"
            else
                # Don't print the actual value for security
                echo "${RED}FAIL:${NC} $var — placeholder value detected"
            fi
            failures=$((failures + 1))
        else
            echo "${GREEN}OK:${NC}   $var"
        fi
    done

    return $failures
}

# =============================================================================
# Main validation
# =============================================================================

load_env_file

TOTAL_FAILURES=0

# Check auth secrets (always required)
echo "${BLUE}> Auth secrets (always required)${NC}"
check_vars "$AUTH_REQUIRED" "Auth" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
echo ""

# Check deployment secrets (always required for deploy)
echo "${BLUE}> Deployment secrets (always required)${NC}"
check_vars "$DEPLOY_REQUIRED" "Deploy" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
echo ""

# Check payments (conditional on PAYMENTS_PROVIDER=stripe)
PAYMENTS_PROVIDER=$(get_env_value "PAYMENTS_PROVIDER")
PAYMENTS_ENABLED=0
if [ "$PAYMENTS_PROVIDER" = "stripe" ] || [ -n "$(get_env_value 'STRIPE_SECRET_KEY')" ]; then
    PAYMENTS_ENABLED=1
fi
echo "${BLUE}> Payment secrets (when PAYMENTS_PROVIDER=stripe)${NC}"
check_vars "$PAYMENTS_REQUIRED" "Payments" 1 "$PAYMENTS_ENABLED" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
echo ""

# Check Redis (conditional on SESSION_STORE_PROVIDER=redis)
SESSION_STORE=$(get_env_value "SESSION_STORE_PROVIDER")
REDIS_ENABLED=0
if [ "$SESSION_STORE" = "redis" ]; then
    REDIS_ENABLED=1
fi
echo "${BLUE}> Redis secrets (when SESSION_STORE_PROVIDER=redis)${NC}"
check_vars "$REDIS_REQUIRED" "Redis" 1 "$REDIS_ENABLED" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
echo ""

# Check Email (conditional on EMAIL_PROVIDER)
EMAIL_PROVIDER=$(get_env_value "EMAIL_PROVIDER")
EMAIL_ENABLED=0
if [ -n "$EMAIL_PROVIDER" ] && [ "$EMAIL_PROVIDER" != "none" ]; then
    EMAIL_ENABLED=1
fi
echo "${BLUE}> Email secrets (when EMAIL_PROVIDER is set)${NC}"
check_vars "$EMAIL_REQUIRED" "Email" 1 "$EMAIL_ENABLED" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))

# Additional email provider checks
if [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
    check_vars "$SENDGRID_REQUIRED" "SendGrid" 1 1 || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
fi
if [ "$EMAIL_PROVIDER" = "resend" ]; then
    check_vars "$RESEND_REQUIRED" "Resend" 1 1 || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
fi
echo ""

# Check Sanity (conditional on SANITY_PROJECT_ID presence)
SANITY_PROJECT_ID=$(get_env_value "SANITY_PROJECT_ID")
SANITY_ENABLED=0
if [ -n "$SANITY_PROJECT_ID" ]; then
    SANITY_ENABLED=1
fi
echo "${BLUE}> Sanity CMS secrets (when using Sanity)${NC}"
check_vars "$SANITY_REQUIRED" "Sanity" 1 "$SANITY_ENABLED" || TOTAL_FAILURES=$((TOTAL_FAILURES + $?))
echo ""

# =============================================================================
# Summary
# =============================================================================

echo "========================================"
echo "  Summary"
echo "========================================"
echo ""

if [ "$DRY_RUN" = "1" ]; then
    echo "${YELLOW}DRY RUN MODE — no validation performed${NC}"
    echo ""
    echo "Run without DRY_RUN=1 to validate environment."
    exit 0
fi

if [ "$TOTAL_FAILURES" -gt 0 ]; then
    echo "${RED}FAIL: $TOTAL_FAILURES required variable(s) missing or placeholder${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Ensure all required secrets are set with real values"
    echo "  2. Replace any TODO_ or placeholder values"
    echo "  3. For conditional requirements, either set the provider or remove the config"
    echo ""
    echo "See: docs/plans/integrated-secrets-workflow-plan.md"
    echo "Schema: packages/config/env-schema.ts"
    exit 1
fi

echo "${GREEN}Deploy environment gate PASSED${NC}"
echo ""
echo "All required variables are present and valid."
exit 0
