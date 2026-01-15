# Secrets Management

This guide explains how to securely manage secrets (API keys, tokens, passwords) across the base-shop monorepo.

## Overview

The monorepo uses environment variables for configuration and secrets. To prevent accidental exposure of sensitive data, we've implemented:

- **Automated secret generation** for local development
- **Pre-commit hooks** to block .env.local commits
- **Centralized documentation** for secret requirements
- **Integration guides** for production secret management

## Quick Start

### Generate Local Development Secrets

```bash
# Generate all secrets to stdout (copy to your .env files)
./scripts/generate-local-secrets.sh

# Generate CMS secrets and save to file
./scripts/generate-local-secrets.sh --app cms --output apps/cms/.env.local

# Generate XA secrets
./scripts/generate-local-secrets.sh --app xa --output apps/xa/.env.local

# Generate uploader secrets
./scripts/generate-local-secrets.sh --app uploader --output apps/xa-uploader/.env.local

# Show help
./scripts/generate-local-secrets.sh --help
```

### Safety Features

The script includes built-in safety:
- **Warns before overwriting** existing .env files
- **Sets restrictive permissions** (600 - owner read/write only)
- **Labels output** as development-only
- **Pre-commit hook** blocks accidental commits

---

## Secret Generation Script

### Usage

```bash
./scripts/generate-local-secrets.sh [OPTIONS]

Options:
  --app APP_NAME    Generate secrets for specific app (cms, xa, uploader, all)
  --output FILE     Write secrets to specific file (default: stdout)
  --help           Show help message
```

### Examples

**Generate all secrets:**
```bash
./scripts/generate-local-secrets.sh
```
Output goes to stdout - copy relevant sections to your .env files.

**Generate CMS secrets only:**
```bash
./scripts/generate-local-secrets.sh --app cms
```

**Save to file:**
```bash
./scripts/generate-local-secrets.sh --app cms --output apps/cms/.env.local
```
The script will:
1. Warn if file exists and prompt for confirmation
2. Generate cryptographically secure secrets
3. Save to file with 600 permissions
4. Display next steps

**Export for current shell:**
```bash
# Generate and export in one command
export $(./scripts/generate-local-secrets.sh --app cms | grep -v '^#' | xargs)
```

---

## Secret Types

### Application Secrets

#### CMS Application
```bash
NEXTAUTH_SECRET           # NextAuth.js session encryption (min 32 chars)
SESSION_SECRET            # Express session secret
CART_COOKIE_SECRET        # Shopping cart cookie encryption
CMS_ACCESS_TOKEN          # CMS API access token
```

#### XA Application
```bash
XA_ACCESS_COOKIE_SECRET   # XA access cookie encryption
XA_STEALTH_INVITE_CODES   # Comma-separated invite codes (e.g., "cipher,abc123")
NEXTAUTH_SECRET           # NextAuth.js session encryption
SESSION_SECRET            # Session secret
CART_COOKIE_SECRET        # Cart cookie encryption
```

#### XA Uploader
```bash
NEXTAUTH_SECRET                # NextAuth secret (hex format)
SESSION_SECRET                 # Session secret (hex format)
CART_COOKIE_SECRET             # Cart cookie secret (hex format)
XA_UPLOADER_ADMIN_TOKEN        # Admin authentication token
XA_UPLOADER_SESSION_SECRET     # Uploader session secret
```

### Common Secrets (All Apps)

```bash
DATABASE_URL              # PostgreSQL connection string
REDIS_URL                 # Redis connection string (optional)
STRIPE_SECRET_KEY         # Stripe test API key (replace with real key)
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
```

---

## Secret Requirements

### Format and Length

| Secret Type | Length | Format | Example |
|------------|--------|--------|---------|
| `NEXTAUTH_SECRET` | 43+ | Base64 | `iQ8xKl...` |
| `SESSION_SECRET` | 32+ | Base64 | `pX9mF...` |
| `CART_COOKIE_SECRET` | 32+ | Base64 | `dR7nH...` |
| Admin tokens | 64+ | Hex | `a3f9c2...` |
| Invite codes | 16+ | Base64/Alphanumeric | `cipher,xy9kL...` |

### Security Strength

The generation script uses `openssl rand` for cryptographically secure random values:

```bash
# Base64 encoding (for secrets that accept any characters)
openssl rand -base64 $((length * 3 / 4))

# Hex encoding (for tokens requiring hex format)
openssl rand -hex $((length / 2))
```

This provides sufficient entropy for all secret types.

---

## Environment File Structure

### Development Setup

Each app has its own `.env.local` file:

```
apps/
├── cms/
│   └── .env.local           # CMS secrets (gitignored)
├── xa/
│   └── .env.local           # XA secrets (gitignored)
└── xa-uploader/
    └── .env.local           # Uploader secrets (gitignored)
```

### Template Files

Template files are committed to the repository:

```
apps/
├── cms/
│   └── .env.example         # Template with placeholder values
├── xa/
│   └── .env.example
└── xa-uploader/
    └── .env.example
```

**Never commit:**
- `.env.local`
- `.env.*.local`
- `.env.production.local`

**Always commit:**
- `.env.example`
- `.env.template`

---

## Secret Rotation

### When to Rotate Secrets

Rotate secrets when:
- **Security incident** - Immediately rotate all secrets
- **Team member departure** - Rotate shared secrets
- **Suspected exposure** - Better safe than sorry
- **Regular schedule** - Every 90 days for production
- **After audit** - If secrets found in logs/errors

### How to Rotate

**Development:**
```bash
# Generate new secrets
./scripts/generate-local-secrets.sh --app cms --output apps/cms/.env.local

# Restart dev server
pnpm --filter @apps/cms dev
```

**Staging/Production:**
Use your secret management system (see Production Secrets below).

### Testing After Rotation

```bash
# Verify app starts
pnpm --filter @apps/cms dev

# Check authentication works
curl http://localhost:3006/api/health

# Run integration tests
pnpm --filter @apps/cms test:integration
```

---

## Production Secrets Management

### DO NOT Use the Generation Script for Production

The `generate-local-secrets.sh` script is for **local development only**. For staging and production, use a proper secrets management system.

### Recommended Systems

#### 1Password Secrets Automation

```bash
# Install 1Password CLI
brew install 1password-cli

# Set up secrets in 1Password vault
op inject -i .env.template -o .env.production

# In CI/CD
op run -- pnpm build
```

#### Doppler

```bash
# Install Doppler CLI
brew install doppler

# Set up secrets
doppler setup

# Run with secrets injected
doppler run -- pnpm dev

# In CI/CD
doppler run -- pnpm build
```

#### Infisical

```bash
# Install Infisical CLI
brew install infisical

# Authenticate
infisical login

# Run with secrets
infisical run -- pnpm dev
```

#### Cloudflare Pages (for Workers)

```bash
# Set secrets via wrangler
wrangler secret put SECRET_NAME

# Or via dashboard
# https://dash.cloudflare.com → Workers → Your Worker → Settings → Variables
```

#### Environment Variables (CI/CD)

For GitHub Actions, Vercel, etc., use their secret management:

**GitHub Actions:**
```yaml
env:
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Vercel:**
```bash
vercel env add NEXTAUTH_SECRET
```

---

## Integration Guide

### New Developer Onboarding

**Step 1: Generate local secrets**
```bash
./scripts/generate-local-secrets.sh --app cms --output apps/cms/.env.local
./scripts/generate-local-secrets.sh --app xa --output apps/xa/.env.local
```

**Step 2: Add real API keys**

Replace placeholder values in `.env.local`:
```bash
# Generated (keep this)
NEXTAUTH_SECRET=iQ8xKl...

# Replace placeholder with real key from Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_REAL_KEY_HERE  # ⚠️ Replace this!
```

**Step 3: Verify setup**
```bash
pnpm --filter @apps/cms dev
```

Visit http://localhost:3006 and test authentication.

### Adding a New App

**Step 1: Update generation script**

Edit `scripts/generate-local-secrets.sh`:
```bash
case $app in
  your-new-app|all)
    echo "#"
    echo "# Your New App Secrets"
    echo "#"
    echo ""

    print_secret "YOUR_APP_SECRET" "$(generate_secret 43)" \
      "Your app secret description"

    if [ "$app" != "all" ]; then
      return
    fi
    ;;
esac
```

**Step 2: Create .env.example**
```bash
# apps/your-new-app/.env.example
YOUR_APP_SECRET=generate_with_script
DATABASE_URL=postgresql://user:password@localhost:5432/base_shop_dev
```

**Step 3: Update documentation**

Add to this document under [Secret Types](#secret-types).

**Step 4: Test generation**
```bash
./scripts/generate-local-secrets.sh --app your-new-app
```

---

## Security Best Practices

### Development

✅ **DO:**
- Generate unique secrets for each developer
- Use the generation script for local development
- Keep .env.local files out of git (pre-commit hook enforces this)
- Use test API keys (Stripe test mode, etc.)
- Rotate secrets after suspected exposure

❌ **DON'T:**
- Share .env.local files via Slack/email
- Commit secrets to git
- Use production secrets in development
- Hardcode secrets in source code
- Log secrets (even in development)

### Production

✅ **DO:**
- Use a dedicated secrets management system (1Password, Doppler, Infisical)
- Rotate secrets every 90 days
- Use different secrets per environment (staging, production)
- Monitor for secret exposure (GitHub secret scanning, etc.)
- Require MFA for secret access

❌ **DON'T:**
- Use the generation script for production
- Store secrets in CI/CD logs
- Send secrets via email/Slack
- Use the same secrets across environments
- Give broad access to production secrets

### Secret Exposure Response

If secrets are exposed:

1. **Immediately revoke** the exposed secret
2. **Generate new secrets** using your production system
3. **Deploy** with new secrets
4. **Audit** where the secret appeared (logs, git history, etc.)
5. **Document** the incident and response

---

## Pre-commit Hook Integration

The repository has a pre-commit hook that prevents committing `.env.local` files.

### How It Works

```bash
# Automatically runs on git commit
git commit -m "Add feature"
```

If you try to commit a `.env.local` file:
```
❌ ERROR: Attempting to commit forbidden file
  → apps/cms/.env.local

This file likely contains secrets or sensitive data.
```

### Testing the Hook

```bash
# Create a test .env.local
echo "SECRET=test" > test.env.local

# Try to commit it
git add test.env.local
git commit -m "Test"

# Expected: Hook blocks the commit
```

### Bypassing (Emergency Only)

```bash
# Only use in emergencies (you'll regret this)
git commit --no-verify -m "Emergency fix"
```

---

## Troubleshooting

### Script Fails: "openssl: command not found"

**Problem:** OpenSSL not installed

**Solution:**
```bash
# macOS
brew install openssl

# Ubuntu/Debian
apt-get install openssl

# Verify
openssl version
```

### Script Generates Same Secret Multiple Times

**Problem:** Random number generator not properly seeded

**Solution:** This shouldn't happen with OpenSSL, but verify:
```bash
# Test randomness
./scripts/generate-local-secrets.sh --app cms | grep NEXTAUTH_SECRET
./scripts/generate-local-secrets.sh --app cms | grep NEXTAUTH_SECRET

# Outputs should be different
```

### App Fails with "Invalid session secret"

**Problem:** Secret too short or wrong format

**Solution:**
```bash
# Check secret length
echo -n "$NEXTAUTH_SECRET" | wc -c

# Should be ≥32 for base64, ≥64 for hex

# Regenerate if too short
./scripts/generate-local-secrets.sh --app cms
```

### Pre-commit Hook Not Running

**Problem:** Git hooks not installed

**Solution:**
```bash
# Install hooks
pnpm prepare

# Or manually
pnpm exec simple-git-hooks

# Verify
ls -la .git/hooks/pre-commit
```

### Secrets in Git History

**Problem:** Accidentally committed secrets

**Solution:**
```bash
# Find the commit
git log --all --full-history -- "**/.env.local"

# Use BFG Repo-Cleaner or git-filter-repo
# See docs/git-hooks.md for full remediation guide
```

---

## Reference

### Related Documentation
- [Git Hooks Guide](./git-hooks.md) - Pre-commit hook details
- [Environment Variables Reference](./.env.reference.md) - All env vars
- [Setup Guide](./setup.md) - Initial setup
- [Logging Guide](./logging.md) - Avoid logging secrets

### Secret Generation Script
- Location: `scripts/generate-local-secrets.sh`
- Uses: `openssl rand` for cryptographic randomness
- Output: Base64 or hex encoded secrets
- Permissions: Sets 600 (owner read/write only)

### External Resources
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [1Password Secrets Automation](https://developer.1password.com/docs/cli/secrets-automation)
- [Doppler Documentation](https://docs.doppler.com/)
- [Infisical Documentation](https://infisical.com/docs)

---

**Last Updated:** 2026-01-12

For questions about secrets management, refer to this guide or ask the team lead.
