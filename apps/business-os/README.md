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

```bash
# Install dependencies (from repo root)
pnpm install

# Run dev server
pnpm --filter @apps/business-os dev

# Visit http://localhost:3020
```

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
