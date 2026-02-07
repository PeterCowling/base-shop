# Business OS

Repo-native Business OS + Kanban system that coordinates human and agent work across all business functions.

## Phase 0 (Local, Single-User)

**Status:** In Development

**Features:**
- Single-user mode (Pete only)
- No authentication required
- Local git operations via `simple-git`
- Auto-PR workflow to main
- Direct filesystem access to `docs/business-os/`

**Architecture:**
- Next.js 15 App Router
- React 19
- Node.js runtime (required for fs + git operations)
- Design system: `@acme/design-system` + `@acme/ui`

## Development

### Local Development (Phase 0: Node + Git)

```bash
# Install dependencies (from repo root)
pnpm install

# Run dev server
pnpm --filter @apps/business-os dev

# Visit http://localhost:3020
```

### Cloudflare D1 Development (Phase 1+: D1-backed)

**Prerequisites:**
- Wrangler CLI installed globally: `npm install -g wrangler`
- Cloudflare account (for remote D1; local D1 works without account)

**Initial Setup:**

```bash
# 1. Create D1 database (one-time, remote only)
cd apps/business-os
wrangler d1 create business-os

# 2. Copy the database_id from output and update wrangler.toml
# Replace "00000000000000000000000000000000" with your actual database_id

# 3. Run migrations (creates tables)
wrangler d1 migrations apply business-os --local  # local D1
wrangler d1 migrations apply business-os          # remote D1
```

**Daily Development:**

```bash
# Query local D1 database
wrangler d1 execute business-os --local --command "SELECT 1 as test"

# List tables
wrangler d1 execute business-os --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Build for Cloudflare Pages (via next-on-pages)
pnpm build
pnpm exec next-on-pages

# Run with Cloudflare dev runtime
wrangler pages dev .vercel/output/static --compatibility-date=2025-06-20
```

**D1 Database Access:**
- **Local:** `--local` flag stores data in `.wrangler/state/v3/d1/`
- **Remote:** Omit `--local` to use production Cloudflare D1

**Note:** Phase 1+ requires Edge runtime conversion (all routes must export `runtime = "edge"`). Until complete, use Phase 0 Node + Git development workflow.

## Remote Access (Free Tunnel)

Access Business OS from external devices (iPad, phone, remote machine) without deploying to production.

**Quick start:**
```bash
# One command to start dev server + create tunnel
./apps/business-os/scripts/tunnel-trycloudflare.sh
```

This will display a public URL like `https://random-words-1234.trycloudflare.com` that you can access from any device.

**Use cases:**
- Demo to collaborators
- Test on real devices (mobile, tablet)
- Access from multiple locations during development

**⚠ Important:** Tunnel URLs are temporary (expire when you stop the script) and should NOT be shared publicly.

**Full documentation:** See [`docs/runbooks/tunnel-setup.md`](../../docs/runbooks/tunnel-setup.md) for:
- Manual setup steps
- Alternative tunnel providers (ngrok)
- Troubleshooting
- Security considerations

## Authentication

**MVP-B1: Invite-only auth system** - Session-based authentication with username + passcode.

### Enable Authentication

By default, auth is **disabled** for backward compatibility. To enable:

```bash
# .env.local
BUSINESS_OS_AUTH_ENABLED=true
SESSION_SECRET=your-secret-key-at-least-32-chars-long

# Generate a secure session secret:
openssl rand -base64 32
```

### User Management

Users are stored in `docs/business-os/people/users.json` with bcrypt-hashed passcodes.

**Development users:**
- `pete` / `pete123` (admin)
- `cristiana` / `cristiana123` (admin)
- `avery` / `avery123` (user)

**Add a new user:**
1. Generate password hash: `node -e "require('bcryptjs').hash('passcode', 10).then(console.log)"`
2. Add to `users.json`:
   ```json
   {
     "id": "username",
     "name": "Display Name",
     "email": "user@business-os.local",
     "role": "admin",
     "passcodeHash": "$2a$10$..."
   }
   ```

### Admin Impersonation (Optional)

Allow admins to switch users for testing/support:

```bash
# .env.local
NEXT_PUBLIC_BUSINESS_OS_ALLOW_ADMIN_IMPERSONATION=true
```

This shows the UserSwitcher component to admins when auth is enabled.

### Security Notes

- **Session cookies**: Encrypted with iron-session, httpOnly, 7-day expiration
- **Password hashing**: bcrypt with 10 rounds
- **Middleware protection**: All routes protected except `/login` and `/api/auth/*`
- **Feature flag**: Auth disabled by default for local development

## Production Deployment

Business OS requires the `BUSINESS_OS_REPO_ROOT` environment variable to locate the monorepo root in production environments (Cloudflare Pages, Vercel, etc.).

```bash
# Required environment variable
BUSINESS_OS_REPO_ROOT=/absolute/path/to/monorepo/root

# Example for Cloudflare Pages/Vercel
BUSINESS_OS_REPO_ROOT=/app
```

**Development:** Repo root is automatically inferred from `process.cwd()` (strips `/apps/business-os` suffix if present).

**Production:** Must explicitly set `BUSINESS_OS_REPO_ROOT` to an absolute path. See `.env.example` for details.

## Structure

```
docs/business-os/          # Canonical storage (markdown + JSON)
├── ideas/
│   ├── inbox/             # Raw ideas
│   └── worked/            # Worked ideas (with cards)
├── cards/                 # Cards (<ID>.user.md + <ID>.agent.md)
│   └── <ID>/
│       ├── comments/      # File-per-comment
│       ├── fact-find.*.md
│       ├── plan.*.md
│       ├── build.*.md
│       └── reflect.*.md
├── strategy/
│   ├── businesses.json
│   └── <BIZ>/
│       └── plan.*.md
├── people/
│   └── people.*.md
└── scans/
```

## Plan Reference

See: `docs/plans/business-os-kanban-plan.md`
