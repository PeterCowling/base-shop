---
Type: Documentation
Domain: Business OS
Status: Active
Created: 2026-01-28
Last-updated: 2026-01-28
---

# Business OS Security Model

## Phase 0: Single-User Hosted Security (Current)

### Access Control

**User Model:**
- Single user: Pete only
- No authentication required (hardcoded identity, Pete-only deployment)
- App deployed to Cloudflare Pages (private deployment URL)
- **SECURITY NOTE:** Phase 0 is Pete-only; multi-user access requires Phase 1 auth implementation

**Authorization Model:**
- Table-based access control (Business OS tables only)
- Defense-in-depth approach

### Write Authorization

**Allowed Tables:**
```
business_os_cards
business_os_ideas
business_os_stage_docs
business_os_audit_log
```

**Denied Tables:**
- All other D1 tables
- Product pipeline tables
- Any other Cloudflare bindings

**Implementation:**
- Server-side enforcement via D1 repository layer
- Applied to all write API routes
- No client-side bypass possible
- Git export runs in CI (GitHub Actions), not in app runtime

**Code Location:**
- `packages/platform-core/src/repositories/businessOs.server.ts`
- `apps/business-os/src/app/api/*/route.ts` (API routes use repositories)

### Read Authorization

**Phase 0:**
- All Business OS documents readable
- No per-user visibility rules
- Single-user assumption

**Phase 1+ (future):**
- User-specific visibility
- Raw ideas visible only to submitter/owner
- Business-scoped access control

### Data Validation

**Input Sanitization:**
- SQL injection prevention (parameterized queries only)
- Zod schema validation on all writes
- Entity ID format enforcement (e.g., `BRIK-ENG-0001`)

**Entity Types:**
- `cards`: Cards with lane, priority, owner, business fields
- `ideas`: Ideas with status, location, business fields
- `stage_docs`: Stage documentation linked to cards
- `audit_log`: Append-only audit events

### Database Security

**D1 Binding Access:**
- Cloudflare D1 binding via `BUSINESS_OS_DB` environment variable
- Binding configured in `apps/business-os/wrangler.toml`
- No direct SQL execution in client code (repositories only)

**Audit Trail:**
- All changes logged in `business_os_audit_log` table
- Append-only audit events (actor, initiator, action, timestamp)
- Git mirror provides secondary audit trail (hourly export)
- PR record preserved for git exports

### Git Export Security

**CI-Only Git Writes:**
- Git export runs in GitHub Actions (not app runtime)
- Uses `CLOUDFLARE_API_TOKEN` secret for D1 access
- Commits to `work/business-os-export` branch
- Auto-PR workflow provides safety gate

**Credentials:**
- No git credentials in app runtime
- GitHub Actions uses built-in `GITHUB_TOKEN`
- D1 access via Cloudflare API token (secret)

## Phase 1+: Multi-User Security (Future)

### Authentication
- Required for multi-user access
- Recommended: GitHub OAuth (aligns with repo-based workflows)
- Must integrate with Cloudflare Pages deployment
- Session management via encrypted cookies or JWTs

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

**Threat:** Accidental writes outside Business OS tables
- **Mitigation:** Repository layer restricts table access
- **Status:** ✅ Implemented

**Threat:** SQL injection attacks
- **Mitigation:** Parameterized queries only, no raw SQL in API routes
- **Status:** ✅ Implemented

**Threat:** Malicious content (XSS via markdown)
- **Mitigation:** react-markdown sanitizes by default
- **Status:** ✅ Implemented

**Threat:** D1 binding credential exposure
- **Mitigation:** Cloudflare runtime manages bindings securely
- **Status:** ✅ Implemented (Cloudflare platform security)

### Phase 0 Non-Threats (Out of Scope)

**Threat:** Unauthorized network access
- **Status:** ⚠️ Mitigated by private deployment URL (Pete-only access)
- **Phase 1+ requirement:** Proper authentication and authorization

**Threat:** Multi-user conflicts
- **Status:** ⚠️ Not applicable (single-user)
- **Phase 1+ requirement:** Optimistic locking and conflict resolution

**Threat:** CSRF attacks
- **Status:** ⚠️ Low risk (Pete-only, no public sharing)
- **Phase 1+ requirement:** CSRF tokens and SameSite cookies

## Security Checklist

### Before Phase 0 Launch
- [x] Table authorization implemented and tested
- [x] D1 binding security (Cloudflare managed)
- [x] Private deployment URL (Pete-only access)
- [x] Markdown sanitization confirmed
- [x] Test coverage for repository layer

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
1. Disable affected API routes in deployment
2. Review D1 audit log for unauthorized changes
3. Restore database from snapshot if needed
4. Fix issue and re-deploy
5. Document in this file

### Emergency Rollback
```bash
# Deploy previous working version
cd apps/business-os
git checkout <previous-commit>
pnpm --filter @apps/business-os deploy:cloudflare

# Or restore D1 from backup
wrangler d1 backup restore BUSINESS_OS_DB --id <backup-id>
```

## References

- Repository layer: `packages/platform-core/src/repositories/businessOs.server.ts`
- D1 schema: `apps/business-os/db/migrations/`
- Test coverage: `packages/platform-core/src/repositories/businessOs.server.test.ts`
- Plan: `docs/plans/database-backed-business-os-plan.md`
