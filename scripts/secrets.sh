#!/bin/sh
# SOPS Secrets Management — Wrapper commands for encrypted env files
#
# This script provides user-friendly wrappers around SOPS for managing
# encrypted environment files. It handles the --input-type dotenv flags
# automatically to avoid format detection friction.
#
# Usage:
#   ./scripts/secrets.sh edit <app> [preview|production]
#   ./scripts/secrets.sh decrypt <app> [preview|production]
#   ./scripts/secrets.sh encrypt <app> [preview|production]
#   ./scripts/secrets.sh list
#   ./scripts/secrets.sh status <app>
#
# Examples:
#   ./scripts/secrets.sh edit cms production     # Edit CMS production secrets
#   ./scripts/secrets.sh decrypt brikette preview # Decrypt Brikette preview env
#   ./scripts/secrets.sh encrypt skylar production # Encrypt Skylar .env to .env.production.sops
#
# This script is part of SEC-03 in the Integrated Secrets Workflow Plan.
# See: docs/plans/integrated-secrets-workflow-plan.md
#
# Prerequisites:
#   - sops: brew install sops (macOS) or https://github.com/getsops/sops
#   - age: brew install age (macOS) or https://github.com/FiloSottile/age
#   - Age key at ~/.config/sops/age/keys.txt

set -e

# Colors for output
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Default environment
DEFAULT_ENV="production"

# Usage
usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  edit <app> [env]      Edit encrypted secrets (opens in \$EDITOR)"
    echo "  decrypt <app> [env]   Decrypt secrets to .env file"
    echo "  encrypt <app> [env]   Encrypt .env file to .env.<env>.sops"
    echo "  list                  List all encrypted secret files"
    echo "  status <app>          Show status of secret files for an app"
    echo "  bootstrap             Generate a new age key pair"
    echo ""
    echo "Options:"
    echo "  <app>                 App name (e.g., cms, brikette, skylar)"
    echo "  [env]                 Environment: preview or production (default: $DEFAULT_ENV)"
    echo ""
    echo "Examples:"
    echo "  $0 edit cms production"
    echo "  $0 decrypt brikette preview"
    echo "  $0 encrypt skylar production"
    echo "  $0 list"
    echo "  $0 bootstrap"
    exit 1
}

# Check prerequisites
check_prereqs() {
    if ! command -v sops >/dev/null 2>&1; then
        echo "${RED}ERROR: sops not found${NC}"
        echo "Install with: brew install sops (macOS)"
        echo "Or visit: https://github.com/getsops/sops"
        exit 2
    fi

    if ! command -v age >/dev/null 2>&1; then
        echo "${RED}ERROR: age not found${NC}"
        echo "Install with: brew install age (macOS)"
        echo "Or visit: https://github.com/FiloSottile/age"
        exit 2
    fi
}

# Get paths for an app/env combination
get_paths() {
    app="$1"
    env="${2:-$DEFAULT_ENV}"

    # Determine app directory
    if [ -d "apps/$app" ]; then
        APP_DIR="apps/$app"
    elif [ -d "packages/$app" ]; then
        APP_DIR="packages/$app"
    else
        echo "${RED}ERROR: App not found: $app${NC}"
        echo "Looked in: apps/$app, packages/$app"
        exit 2
    fi

    ENCRYPTED_FILE="$APP_DIR/.env.$env.sops"
    PLAIN_FILE="$APP_DIR/.env"
}

# Edit encrypted secrets
cmd_edit() {
    app="$1"
    env="${2:-$DEFAULT_ENV}"

    if [ -z "$app" ]; then
        echo "${RED}ERROR: App name required${NC}"
        usage
    fi

    check_prereqs
    get_paths "$app" "$env"

    echo "${BLUE}Editing:${NC} $ENCRYPTED_FILE"

    if [ ! -f "$ENCRYPTED_FILE" ]; then
        echo "${YELLOW}WARN: File does not exist, will create new encrypted file${NC}"
        echo ""
        echo "To create a new encrypted file:"
        echo "  1. Create $PLAIN_FILE with your secrets"
        echo "  2. Run: $0 encrypt $app $env"
        exit 1
    fi

    # Use sops edit with explicit dotenv format
    sops --input-type dotenv --output-type dotenv "$ENCRYPTED_FILE"

    echo "${GREEN}OK:${NC} Secrets updated"
}

# Decrypt secrets to .env
cmd_decrypt() {
    app="$1"
    env="${2:-$DEFAULT_ENV}"

    if [ -z "$app" ]; then
        echo "${RED}ERROR: App name required${NC}"
        usage
    fi

    check_prereqs
    get_paths "$app" "$env"

    echo "${BLUE}Decrypting:${NC} $ENCRYPTED_FILE → $PLAIN_FILE"

    if [ ! -f "$ENCRYPTED_FILE" ]; then
        echo "${RED}ERROR: Encrypted file not found: $ENCRYPTED_FILE${NC}"
        exit 1
    fi

    # Decrypt with explicit dotenv format
    sops -d --input-type dotenv --output-type dotenv "$ENCRYPTED_FILE" > "$PLAIN_FILE"

    echo "${GREEN}OK:${NC} Decrypted to $PLAIN_FILE"
    echo ""
    echo "${YELLOW}NOTE:${NC} $PLAIN_FILE is gitignored and should never be committed"
}

# Encrypt .env to .env.<env>.sops
cmd_encrypt() {
    app="$1"
    env="${2:-$DEFAULT_ENV}"

    if [ -z "$app" ]; then
        echo "${RED}ERROR: App name required${NC}"
        usage
    fi

    check_prereqs
    get_paths "$app" "$env"

    echo "${BLUE}Encrypting:${NC} $PLAIN_FILE → $ENCRYPTED_FILE"

    if [ ! -f "$PLAIN_FILE" ]; then
        echo "${RED}ERROR: Plain env file not found: $PLAIN_FILE${NC}"
        echo ""
        echo "Create $PLAIN_FILE first, then run this command."
        exit 1
    fi

    # Check for placeholder values before encrypting
    if grep -qE '^[A-Z_]+=TODO_' "$PLAIN_FILE"; then
        echo "${YELLOW}WARN: Found TODO_ placeholder values in $PLAIN_FILE${NC}"
        echo "These will be encrypted but will fail the deploy gate."
        echo ""
    fi

    # Encrypt with explicit dotenv format
    sops -e --input-type dotenv --output-type dotenv "$PLAIN_FILE" > "$ENCRYPTED_FILE"

    echo "${GREEN}OK:${NC} Encrypted to $ENCRYPTED_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Commit $ENCRYPTED_FILE"
    echo "  2. Delete $PLAIN_FILE (it's gitignored but shouldn't linger)"
}

# List all encrypted files
cmd_list() {
    echo "${BLUE}Encrypted secret files:${NC}"
    echo ""

    found=0
    # Use find to avoid glob expansion issues
    while IFS= read -r f; do
        if [ -n "$f" ] && [ -f "$f" ]; then
            echo "  $f"
            found=$((found + 1))
        fi
    done <<EOF
$(find apps packages -maxdepth 2 -name "*.env.*.sops" -type f 2>/dev/null || true)
EOF

    if [ "$found" -eq 0 ]; then
        echo "  (none found)"
        echo ""
        echo "To create encrypted secrets:"
        echo "  1. Create apps/<app>/.env with your secrets"
        echo "  2. Run: $0 encrypt <app> [preview|production]"
    else
        echo ""
        echo "Found $found encrypted file(s)"
    fi
}

# Show status of secret files for an app
cmd_status() {
    app="$1"

    if [ -z "$app" ]; then
        echo "${RED}ERROR: App name required${NC}"
        usage
    fi

    # Determine app directory
    if [ -d "apps/$app" ]; then
        APP_DIR="apps/$app"
    elif [ -d "packages/$app" ]; then
        APP_DIR="packages/$app"
    else
        echo "${RED}ERROR: App not found: $app${NC}"
        exit 2
    fi

    echo "${BLUE}Secret files for:${NC} $app"
    echo ""

    # Check preview
    preview_file="$APP_DIR/.env.preview.sops"
    if [ -f "$preview_file" ]; then
        echo "${GREEN}✓${NC} Preview:    $preview_file"
    else
        echo "${YELLOW}○${NC} Preview:    $preview_file (not found)"
    fi

    # Check production
    prod_file="$APP_DIR/.env.production.sops"
    if [ -f "$prod_file" ]; then
        echo "${GREEN}✓${NC} Production: $prod_file"
    else
        echo "${YELLOW}○${NC} Production: $prod_file (not found)"
    fi

    # Check plain .env (should be gitignored)
    plain_file="$APP_DIR/.env"
    if [ -f "$plain_file" ]; then
        echo "${YELLOW}!${NC} Plain .env: $plain_file (exists - ensure gitignored)"
    fi
}

# Bootstrap: generate a new age key pair
cmd_bootstrap() {
    KEY_DIR="$HOME/.config/sops/age"
    KEY_FILE="$KEY_DIR/keys.txt"

    echo "${BLUE}Bootstrapping SOPS/age key pair${NC}"
    echo ""

    if [ -f "$KEY_FILE" ]; then
        echo "${YELLOW}WARN: Key file already exists: $KEY_FILE${NC}"
        echo ""
        echo "Your public key:"
        grep "public key:" "$KEY_FILE" | sed 's/.*public key: //'
        echo ""
        echo "To generate a new key, first backup/remove the existing one."
        exit 0
    fi

    check_prereqs

    echo "Generating new age key pair..."
    mkdir -p "$KEY_DIR"
    age-keygen -o "$KEY_FILE" 2>&1

    echo ""
    echo "${GREEN}OK:${NC} Key pair generated at $KEY_FILE"
    echo ""
    echo "Your public key (add to .sops.yaml):"
    grep "public key:" "$KEY_FILE" | sed 's/.*public key: //'
    echo ""
    echo "Next steps:"
    echo "  1. Add the public key to .sops.yaml in this repo"
    echo "  2. Add the private key content to GitHub secret SOPS_AGE_KEY"
    echo "     Run: cat $KEY_FILE | pbcopy  # copies to clipboard"
    echo "  3. Commit the updated .sops.yaml"
}

# Main
case "${1:-}" in
    edit)
        shift
        cmd_edit "$@"
        ;;
    decrypt)
        shift
        cmd_decrypt "$@"
        ;;
    encrypt)
        shift
        cmd_encrypt "$@"
        ;;
    list)
        cmd_list
        ;;
    status)
        shift
        cmd_status "$@"
        ;;
    bootstrap)
        cmd_bootstrap
        ;;
    *)
        usage
        ;;
esac
