# Operator Prerequisites Checklist — XA Apps Staging

Before the first CI run can succeed and before user testing begins, complete these steps in order.

---

## 1. GitHub Actions Secrets

Set at repository level (Settings → Secrets and variables → Actions → Repository secrets):

```
CLOUDFLARE_API_TOKEN   — CF API token with Workers Scripts:Edit + Account:Read
CLOUDFLARE_ACCOUNT_ID  — Your Cloudflare Account ID (from CF dashboard URL or Overview page)
```

> The API token needs: Account > Workers Scripts > Edit, Account > Workers R2 Storage > Edit (for bucket creation), Zone > (none required for Workers).

---

## 2. R2 Bucket for xa-drop-worker Staging

Create the staging R2 bucket before the first xa-drop-worker deploy:

```bash
cd apps/xa-drop-worker
pnpm exec wrangler r2 bucket create xa-submissions-preview
```

Verify:
```bash
pnpm exec wrangler r2 bucket list | grep xa-submissions
```

---

## 3. xa-drop-worker Staging Secrets

Set per-environment secrets for the preview Worker. Run from `apps/xa-drop-worker/`:

```bash
pnpm exec wrangler secret put UPLOAD_TOKEN_SECRET --env preview
# Enter a 32+ character random secret when prompted

pnpm exec wrangler secret put CATALOG_WRITE_TOKEN --env preview
# Enter the token that xa-uploader will use to write the catalog

pnpm exec wrangler secret put CATALOG_READ_TOKEN --env preview
# Enter the token xa-b uses at build time to fetch the catalog (optional; omit for public read)
```

> The Worker will deploy without these secrets but upload and catalog endpoints will reject all requests with 401.

---

## 4. xa-uploader Staging Secrets

Set session/auth secrets for the operator console. Run from `apps/xa-uploader/`:

```bash
pnpm exec wrangler secret put XA_UPLOADER_SESSION_SECRET --env preview
# 32+ character random secret for session signing

pnpm exec wrangler secret put XA_UPLOADER_ADMIN_TOKEN --env preview
# Admin access token for the uploader console
```

> If not set, xa-uploader randomises these on each cold start, which means sessions are invalidated on every Worker restart. Acceptable for light staging use; set for any persistent sessions.

---

## 5. xa-b Staging Secrets and Env Vars

xa-b deploys as a CF Worker (not CF Pages). All vars must be set via wrangler, not the CF Pages dashboard. Run from `apps/xa-b/`:

### 5a. Access cookie secret

```bash
pnpm exec wrangler secret put XA_ACCESS_COOKIE_SECRET --env preview
# 32+ character random secret for invite cookie signing
```

### 5b. Invite codes (comma-separated)

```bash
pnpm exec wrangler secret put XA_STEALTH_INVITE_CODES --env preview
# e.g. "testcode1,testcode2"
```

### 5c. CF Access configuration

After completing step 6 (CF Access Application setup), set:

```bash
pnpm exec wrangler secret put XA_CF_ACCESS_AUDIENCE --env preview
# The Audience Tag from the CF Access Application you created

pnpm exec wrangler secret put XA_CF_ACCESS_ISSUER --env preview
# The issuer URL, e.g. https://<your-team>.cloudflareaccess.com
```

### 5d. Allowed hosts (optional, set as a var in wrangler.toml)

If you want to restrict which hostnames xa-b responds to, add to `[env.preview.vars]` in `apps/xa-b/wrangler.toml`:

```toml
[env.preview.vars]
XA_ALLOWED_HOSTS = "xa-b-preview.<your-account-id>.workers.dev"
# ... other existing vars
```

---

## 6. CF Access Application for xa-b Staging

Set up a Cloudflare Access Application so authorised testers can reach the storefront:

1. Log in to Cloudflare Zero Trust dashboard → Access → Applications.
2. Create a new Self-Hosted application.
3. Application domain: `xa-b-preview.<your-account-id>.workers.dev` (the CF Worker URL after first deploy).
4. Set an Access Policy: allow specific email addresses or an email domain for your testers.
5. Note the **Audience Tag** from the application — you will need it for step 5c above.
6. The issuer URL is: `https://<your-team>.cloudflareaccess.com`

> xa-b's CI health check accepts HTTP 302 and 403 as healthy responses (the stealth gate is working). A 5xx response means the Worker itself has an error.

---

## 7. XA_CATALOG_CONTRACT_READ_URL in CI

After the first successful deploy of xa-drop-worker, note the staging Worker URL:
```
https://xa-drop-worker-preview.<your-account-id>.workers.dev
```

Add this as a GitHub Actions variable (not secret) at repository level:
```
XA_CATALOG_CONTRACT_READ_URL = https://xa-drop-worker-preview.<your-account-id>.workers.dev/catalog/xa-b
```

This is used as an env var in the xa-b build step so the storefront can optionally fetch the live catalog at CI build time. If not set, xa-b falls back to the bundled `catalog.json`.

---

## 8. Catalog Seeding (Before User Testing Begins)

The staging xa-b storefront starts with an empty or demo catalog. Before user testing:

1. Start xa-uploader locally pointing at the staging xa-drop-worker:
   ```bash
   XA_DROP_WORKER_URL=https://xa-drop-worker-preview.<account>.workers.dev \
   XA_CATALOG_WRITE_TOKEN=<CATALOG_WRITE_TOKEN from step 3> \
   pnpm --filter @apps/xa-uploader dev
   ```

2. Upload a catalog via the xa-uploader console at `http://localhost:3020`.

3. Re-trigger the xa-b CI build (push any commit or use `gh workflow run xa.yml`) so the storefront fetches and bundles the new catalog.

---

## Checklist Summary (order matters)

- [ ] 1. GitHub Actions secrets set (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] 2. `xa-submissions-preview` R2 bucket created
- [ ] 3. xa-drop-worker secrets set (`UPLOAD_TOKEN_SECRET`, `CATALOG_WRITE_TOKEN`, `CATALOG_READ_TOKEN`)
- [ ] 4. xa-uploader staging secrets set (`XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`)
- [ ] 5. xa-b staging secrets set (`XA_ACCESS_COOKIE_SECRET`, `XA_STEALTH_INVITE_CODES`)
- [ ] 6. CF Access Application created for `xa-b-preview.<account>.workers.dev`; audience + issuer secrets set (steps 5c)
- [ ] 7. `XA_CATALOG_CONTRACT_READ_URL` GitHub Actions variable set (after first drop-worker deploy)
- [ ] 8. Catalog seeded before user testing begins
