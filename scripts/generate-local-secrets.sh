#!/bin/bash
# scripts/generate-local-secrets.sh
#
# Generates secure random secrets for local development environment files.
# This script creates cryptographically secure random strings suitable for
# authentication secrets, session tokens, and API keys.
#
# Usage:
#   ./scripts/generate-local-secrets.sh [--app APP_NAME] [--output FILE]
#
# Options:
#   --app APP_NAME    Generate secrets for specific app (cms, xa, etc.)
#   --output FILE     Write secrets to specific file (default: stdout)
#   --help           Show this help message
#
# Examples:
#   # Generate all secrets to stdout
#   ./scripts/generate-local-secrets.sh
#
#   # Generate secrets for CMS app
#   ./scripts/generate-local-secrets.sh --app cms
#
#   # Save to .env.local file
#   ./scripts/generate-local-secrets.sh --app cms --output .env.cms.local

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
APP=""
OUTPUT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --app)
      APP="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --help|-h)
      head -n 18 "$0" | tail -n +2 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to generate a secure random string
# Args: $1 = length (default 32)
generate_secret() {
  local length=${1:-32}
  openssl rand -base64 $((length * 3 / 4)) | tr -d '\n' | head -c "$length"
}

# Function to generate a hex token
# Args: $1 = length (default 64)
generate_hex_token() {
  local length=${1:-64}
  openssl rand -hex $((length / 2))
}

# Function to print a secret line
print_secret() {
  local name=$1
  local value=$2
  local comment=${3:-""}

  if [ -n "$comment" ]; then
    echo "# $comment"
  fi
  echo "$name=$value"
  echo ""
}

# Main output function
generate_secrets() {
  local app=${1:-"all"}

  echo "# Generated secrets for local development"
  echo "# Created: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "# DO NOT COMMIT THIS FILE"
  echo ""
  echo "# ⚠️  WARNING: These are randomly generated secrets for LOCAL DEVELOPMENT only."
  echo "# For production, use a proper secrets management system (1Password, Doppler, etc.)"
  echo ""

  case $app in
    cms|all)
      echo "#"
      echo "# CMS Application Secrets"
      echo "#"
      echo ""

      print_secret "NEXTAUTH_SECRET" "$(generate_secret 43)" \
        "NextAuth.js session encryption key (min 32 chars)"

      print_secret "SESSION_SECRET" "$(generate_secret 43)" \
        "Express session secret"

      print_secret "CART_COOKIE_SECRET" "$(generate_secret 43)" \
        "Shopping cart cookie encryption"

      print_secret "CMS_ACCESS_TOKEN" "$(generate_secret 43)" \
        "CMS API access token"

      if [ "$app" != "all" ]; then
        return
      fi
      ;;
  esac

  case $app in
    xa|all)
      echo "#"
      echo "# XA Application Secrets"
      echo "#"
      echo ""

      print_secret "XA_ACCESS_COOKIE_SECRET" "$(generate_secret 32)" \
        "XA access cookie encryption"

      print_secret "XA_STEALTH_INVITE_CODES" "cipher,$(generate_secret 16)" \
        "Comma-separated invite codes"

      print_secret "NEXTAUTH_SECRET" "$(generate_secret 43)" \
        "NextAuth.js session encryption"

      print_secret "SESSION_SECRET" "$(generate_secret 43)" \
        "Session secret"

      print_secret "CART_COOKIE_SECRET" "$(generate_secret 32)" \
        "Cart cookie encryption"

      if [ "$app" != "all" ]; then
        return
      fi
      ;;
  esac

  case $app in
    uploader|all)
      echo "#"
      echo "# XA Uploader Secrets"
      echo "#"
      echo ""

      print_secret "NEXTAUTH_SECRET" "$(generate_hex_token 64)" \
        "NextAuth secret (hex format)"

      print_secret "SESSION_SECRET" "$(generate_hex_token 64)" \
        "Session secret (hex format)"

      print_secret "CART_COOKIE_SECRET" "$(generate_hex_token 64)" \
        "Cart cookie secret (hex format)"

      print_secret "XA_UPLOADER_ADMIN_TOKEN" "$(generate_hex_token 64)" \
        "Admin authentication token"

      print_secret "XA_UPLOADER_SESSION_SECRET" "$(generate_hex_token 64)" \
        "Uploader session secret"

      if [ "$app" != "all" ]; then
        return
      fi
      ;;
  esac

  case $app in
    all)
      echo "#"
      echo "# Common Secrets (All Apps)"
      echo "#"
      echo ""

      print_secret "DATABASE_URL" "postgresql://user:password@localhost:5432/base_shop_dev" \
        "PostgreSQL connection string"

      print_secret "REDIS_URL" "redis://localhost:6379" \
        "Redis connection string (optional)"

      print_secret "STRIPE_SECRET_KEY" "sk_test_placeholder_$(generate_secret 24)" \
        "Stripe test API key (replace with real key)"

      print_secret "STRIPE_WEBHOOK_SECRET" "whsec_$(generate_secret 32)" \
        "Stripe webhook signing secret"
      ;;
  esac
}

# Main execution
main() {
  if [ -z "$OUTPUT" ]; then
    # Output to stdout
    echo -e "${BLUE}Generating secrets...${NC}" >&2
    echo "" >&2
    generate_secrets "$APP"
    echo "" >&2
    echo -e "${YELLOW}⚠️  These secrets were written to stdout.${NC}" >&2
    echo -e "${YELLOW}   Copy them to your .env.local file manually.${NC}" >&2
  else
    # Check if output file exists
    if [ -f "$OUTPUT" ]; then
      echo -e "${YELLOW}⚠️  File $OUTPUT already exists!${NC}" >&2
      read -p "Overwrite? (y/N) " -n 1 -r
      echo "" >&2
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted." >&2
        exit 1
      fi
    fi

    # Generate to file
    echo -e "${BLUE}Generating secrets to $OUTPUT...${NC}" >&2
    generate_secrets "$APP" > "$OUTPUT"

    # Set restrictive permissions
    chmod 600 "$OUTPUT"

    echo -e "${GREEN}✓ Secrets generated successfully${NC}" >&2
    echo -e "${GREEN}✓ File permissions set to 600 (owner read/write only)${NC}" >&2
    echo "" >&2
    echo -e "${YELLOW}Next steps:${NC}" >&2
    echo "  1. Review the generated secrets in $OUTPUT" >&2
    echo "  2. Replace placeholder values with real credentials" >&2
    echo "  3. NEVER commit this file to git" >&2
    echo "" >&2
    echo -e "${BLUE}To use these secrets:${NC}" >&2
    echo "  export \$(cat $OUTPUT | xargs)" >&2
    echo "  # or" >&2
    echo "  pnpm --filter @apps/cms dev  # Automatically loads .env.local" >&2
  fi
}

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
  echo -e "${RED}Error: openssl is not installed${NC}" >&2
  echo "Install with: brew install openssl (macOS) or apt-get install openssl (Linux)" >&2
  exit 1
fi

# Run main function
main
