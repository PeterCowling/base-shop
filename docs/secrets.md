# Secrets Management

This guide covers how to manage secrets for Base-Shop applications using SOPS/age encryption.

## Quick Start

### 1. Bootstrap (First Time Only)

Generate your age key pair:

```bash
./scripts/secrets.sh bootstrap
```

This creates `~/.config/sops/age/keys.txt` containing your private key.

### 2. Create Encrypted Secrets

```bash
# Create a plain .env file with your secrets
cat > apps/shop-acme/.env << 'EOF'
NEXTAUTH_SECRET=your-32-char-secret-here
SESSION_SECRET=another-32-char-secret
STRIPE_SECRET_KEY=sk_test_xxx
EOF

# Encrypt for production
./scripts/secrets.sh encrypt shop-acme production

# Encrypt for preview (optional, for staging deploys)
./scripts/secrets.sh encrypt shop-acme preview

# Delete the plain .env (it's gitignored but shouldn't linger)
rm apps/shop-acme/.env
```

### 3. Configure CI

Add your age key to GitHub Secrets:

```bash
# Copy key to clipboard
cat ~/.config/sops/age/keys.txt | pbcopy

# Add as SOPS_AGE_KEY secret in GitHub repo settings
```

### 4. Deploy

CI automatically decrypts secrets when `SOPS_AGE_KEY` is configured.

## Commands Reference

| Command | Description |
|---------|-------------|
| `./scripts/secrets.sh bootstrap` | Generate new age key pair |
| `./scripts/secrets.sh encrypt <app> [env]` | Encrypt `.env` → `.env.<env>.sops` |
| `./scripts/secrets.sh decrypt <app> [env]` | Decrypt `.env.<env>.sops` → `.env` |
| `./scripts/secrets.sh edit <app> [env]` | Edit encrypted file in `$EDITOR` |
| `./scripts/secrets.sh list` | List all encrypted files |
| `./scripts/secrets.sh status <app>` | Show status of secret files |

**Note:** `[env]` defaults to `production`. Use `preview` for staging secrets.

## File Locations

| File | Purpose | Committed? |
|------|---------|------------|
| `apps/<app>/.env.production.sops` | Production secrets (encrypted) | Yes |
| `apps/<app>/.env.preview.sops` | Preview/staging secrets (encrypted) | Yes |
| `apps/<app>/.env` | Decrypted secrets (local only) | No (gitignored) |
| `~/.config/sops/age/keys.txt` | Your age private key | No (local only) |

## Required Secrets by Category

### Always Required

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | NextAuth.js session encryption (32+ chars) |
| `SESSION_SECRET` | Session cookie signing (32+ chars) |
| `CART_COOKIE_SECRET` | Cart cookie encryption |

### CI/Deploy

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `SOPS_AGE_KEY` | Age private key for SOPS decryption |

### Conditional (When Provider Enabled)

| Variable | Condition | Description |
|----------|-----------|-------------|
| `STRIPE_SECRET_KEY` | When using Stripe | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | When using Stripe | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | When using Stripe | Stripe publishable key |
| `UPSTASH_REDIS_REST_URL` | When using Redis | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | When using Redis | Upstash Redis REST token |

## Workflows

### Creating a New Shop with Secrets

```bash
# Option 1: Use existing encrypted secrets
pnpm ts-node scripts/src/init-shop.ts my-shop --from-sops production --skip-prompts

# Option 2: Create shop first, then encrypt secrets
pnpm ts-node scripts/src/init-shop.ts my-shop --skip-prompts
# Edit apps/shop-my-shop/.env with real values
./scripts/secrets.sh encrypt shop-my-shop production
```

### Rotating a Secret

1. Update the secret value in the encrypted file:
   ```bash
   ./scripts/secrets.sh edit shop-acme production
   ```

2. Commit the updated `.env.production.sops`:
   ```bash
   git add apps/shop-acme/.env.production.sops
   git commit -m "Rotate STRIPE_SECRET_KEY"
   ```

3. Deploy:
   ```bash
   git push origin main
   ```

### Rollback a Bad Secret

1. Revert the commit that changed the secret:
   ```bash
   git revert <commit-sha>
   ```

2. Push to trigger redeploy:
   ```bash
   git push origin main
   ```

### Migrating an Existing Shop

For shops with manual `.env` handling:

1. Ensure your local `.env` has correct values
2. Encrypt it:
   ```bash
   ./scripts/secrets.sh encrypt shop-existing production
   ```
3. Commit the encrypted file
4. Add `SOPS_AGE_KEY` to GitHub Secrets if not already done

## Validation

### Local Validation

```bash
# Validate a decrypted .env file
./scripts/validate-deploy-env.sh apps/shop-acme/.env
```

### CI Validation

CI automatically validates secrets before deploy. Deployments fail if:
- Required variables are missing
- Variables contain `TODO_` placeholders

## Security Notes

1. **Never commit plain `.env` files** - They're gitignored for a reason
2. **Never log secret values** - All tooling reports variable names only
3. **Limit CI access** - `SOPS_AGE_KEY` can decrypt all secrets
4. **Use GitHub Environments** - Add approval requirements for production deploys

## Troubleshooting

### "SOPS not found"

Install SOPS:
```bash
brew install sops  # macOS
```

### "Age key not found"

Run bootstrap:
```bash
./scripts/secrets.sh bootstrap
```

### "Could not decrypt"

The age key doesn't match. Check:
- Local: `~/.config/sops/age/keys.txt` exists
- CI: `SOPS_AGE_KEY` secret is set correctly
- The `.sops.yaml` file has the correct public key

### "TODO_ placeholder detected"

Replace placeholder values with real secrets:
```bash
./scripts/secrets.sh edit <app> <env>
```

## Related Documentation

- [Integrated Secrets Workflow Plan](plans/integrated-secrets-workflow-plan.md)
- [Launch Shop Runbook](launch-shop-runbook.md)
- [Deploy Health Checks](deploy-health-checks.md)
