---
Type: Documentation
Domain: Business OS
Status: Active
Created: 2026-01-28
Last-updated: 2026-01-28
---

# Business OS Security Model

## Phase 0: Local-Only Security (Current)

### Access Control

**User Model:**
- Single user: Pete only
- No authentication required (local development only)
- App runs on `localhost:3020`
- **SECURITY CRITICAL:** App MUST NOT be deployed to public URL in Phase 0

**Authorization Model:**
- Path-based allowlist (not user-specific)
- Defense-in-depth approach

### Write Authorization

**Allowed Paths:**
```
docs/business-os/**
```

**Denied Paths:**
- All other `docs/**` paths
- Repository root files
- Source code directories
- Any path outside repository

**Implementation:**
- Server-side enforcement via `authorizeWrite()` function
- Applied to all write API routes
- No client-side bypass possible

**Code Location:**
- `apps/business-os/src/lib/auth/authorize.ts`
- `apps/business-os/src/lib/auth/middleware.ts`

### Read Authorization

**Phase 0:**
- All Business OS documents readable
- No per-user visibility rules
- Single-user assumption

**Phase 1+ (future):**
- User-specific visibility
- Raw ideas visible only to submitter/owner
- Business-scoped access control

### Path Validation

**Sanitization:**
- Directory traversal attempts blocked (`../`, `~`)
- Path normalization enforced
- Leading slashes removed

**Location Types:**
- `ideas`: inbox/worked subdirectories only
- `cards`: flat structure + stage doc subdirectories
- `strategy`: JSON files + business subdirectories
- `people`: flat markdown files
- `scans`: JSON files + history subdirectory

### Git Security

**Credentials:**
- Uses existing git credential helper (`osxkeychain`)
- No credentials stored in app
- HTTPS remote only (never SSH with custom keys)

**Branch Model:**
- Commits to `work/business-os-store` branch
- Never commits directly to `main`
- Auto-PR workflow provides safety gate

**Audit Trail:**
- All changes visible in git history
- PR record preserved (even after auto-merge)
- Commit author properly attributed

### File System Security

**Worktree Isolation:**
- Dedicated worktree separate from dev checkout
- Located at `../base-shop-business-os-store/`
- Prevents accidental modification of dev files

**File Permissions:**
- Respects filesystem permissions
- No privilege escalation
- Standard user permissions only

## Phase 1+: Multi-User Security (Future)

### Authentication
- To be determined
- Options: GitHub OAuth, magic links, etc.
- Must work with hosted deployment

### Authorization
- User-scoped read permissions
- Business-scoped write permissions
- Role-based access control (owner, contributor, viewer)

### CSRF Protection
- Origin validation
- CSRF tokens for write operations
- SameSite cookie policy

### Rate Limiting
- Per-user write limits
- Global rate limiting for hosted deployment
- Prevent abuse

### Audit Logging
- User actions logged
- Write operations tracked
- Security events monitored

## Threat Model

### Phase 0 Threats (Mitigated)

**Threat:** Accidental writes outside Business OS area
- **Mitigation:** Server-side path allowlist
- **Status:** ✅ Implemented

**Threat:** Directory traversal attacks
- **Mitigation:** Path sanitization, allowlist
- **Status:** ✅ Implemented

**Threat:** Malicious file content (XSS via markdown)
- **Mitigation:** react-markdown sanitizes by default
- **Status:** ✅ Implemented

**Threat:** Git credential exposure
- **Mitigation:** Use system credential helper, no storage
- **Status:** ✅ Implemented

### Phase 0 Non-Threats (Out of Scope)

**Threat:** Unauthorized network access
- **Status:** ⚠️ Not applicable (local-only, no public URL)
- **Phase 1+ requirement:** Authentication

**Threat:** Multi-user conflicts
- **Status:** ⚠️ Not applicable (single-user)
- **Phase 1+ requirement:** Concurrency control

**Threat:** CSRF attacks
- **Status:** ⚠️ Not applicable (no public URL)
- **Phase 1+ requirement:** CSRF protection

## Security Checklist

### Before Phase 0 Launch
- [x] Path authorization implemented and tested
- [x] Git credentials via system helper (no storage)
- [x] No public deployment (local-only confirmed)
- [x] Markdown sanitization confirmed
- [x] Test coverage for authorization logic

### Before Phase 1 Launch
- [ ] Authentication implemented
- [ ] User-scoped authorization
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Security review/penetration test

## Incident Response

### Phase 0
If security issue discovered:
1. Stop `pnpm dev` server immediately
2. `git revert` any problematic commits
3. Review git history for unauthorized changes
4. Fix issue and re-test
5. Document in this file

### Emergency Rollback
```bash
# Stop server
pkill -f "next dev.*3020"

# Revert last commit
cd ../base-shop-business-os-store
git revert HEAD
git push

# PR will be auto-created for revert
```

## References

- Authorization code: `apps/business-os/src/lib/auth/`
- Test coverage: `apps/business-os/src/lib/auth/authorize.test.ts`
- Plan: `docs/plans/business-os-kanban-plan.md` (BOS-09)
