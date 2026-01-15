<!-- docs/commerce/inventory-deployment-checklist.md -->

Type: Checklist
Status: Active
Domain: Commerce / Inventory / Deployment
Last-reviewed: 2026-01-12

# Inventory System Deployment Checklist

**Purpose:** Step-by-step checklist for deploying the inventory holds system to production

---

## Pre-Deployment

### Database Setup

- [ ] **Run Prisma migration**
  ```bash
  pnpm --filter @acme/platform-core exec prisma migrate dev --name add_inventory_holds
  ```
  - [ ] Verify migration succeeded
  - [ ] Check tables exist: `InventoryHold`, `InventoryHoldItem`
  - [ ] Verify indexes created

- [ ] **Generate Prisma client**
  ```bash
  pnpm prisma:generate
  ```

- [ ] **Test database connectivity**
  ```bash
  psql $DATABASE_URL -c "SELECT 1"
  ```

### Environment Configuration

- [ ] **CMS Environment Variables** (`apps/cms/.env`)
  ```bash
  DATABASE_URL=postgresql://...
  INVENTORY_BACKEND=prisma
  INVENTORY_MODE=validate_only  # Start with validate_only
  INVENTORY_HOLD_TTL_SECONDS=1200
  SKIP_INVENTORY_VALIDATION=0
  CRON_SECRET=<generate-with-openssl-rand-hex-32>
  STOCK_ALERT_RECIPIENT=ops@yourshop.com
  ```

- [ ] **Shop Environment Variables** (`apps/*/env`)
  ```bash
  INVENTORY_MODE=validate_only  # Start with validate_only
  INVENTORY_HOLD_TTL_SECONDS=1200
  SKIP_INVENTORY_VALIDATION=0
  ```

- [ ] **Worker Environment Variables** (if applicable)
  ```toml
  # wrangler.toml
  [vars]
  INVENTORY_AUTHORITY_URL = "https://your-cms.example.com/api/inventory"
  INVENTORY_AUTHORITY_TOKEN = "your-secure-token"
  ```

- [ ] **Generate secure tokens**
  ```bash
  # CRON_SECRET
  openssl rand -hex 32

  # INVENTORY_AUTHORITY_TOKEN
  openssl rand -hex 32
  ```

### Code Verification

- [ ] **Run tests**
  ```bash
  pnpm --filter @acme/platform-core test inventoryHolds
  ```

- [ ] **Type check**
  ```bash
  pnpm --filter @acme/platform-core exec tsc --noEmit
  ```

- [ ] **Build packages**
  ```bash
  pnpm build
  ```

- [ ] **Verify exports**
  - [ ] Check `@acme/platform-core/inventoryHolds` exports work
  - [ ] Check `@acme/platform-core/inventory/client` exports work

---

## Staging Deployment

### Phase 1: Validate-Only Mode (Week 1)

- [ ] **Deploy to staging**
  ```bash
  git checkout main
  git pull
  pnpm build
  # Deploy via your CI/CD
  ```

- [ ] **Verify CMS APIs**
  - [ ] Test validation endpoint: `POST /api/inventory/validate`
  - [ ] Test health endpoint: `GET /api/inventory/health`
  - [ ] Verify authentication works

- [ ] **Test checkout flow**
  - [ ] Create cart with valid items
  - [ ] Proceed to checkout
  - [ ] Verify validation occurs
  - [ ] Complete payment
  - [ ] Verify no errors

- [ ] **Test insufficient stock**
  - [ ] Create cart with out-of-stock items
  - [ ] Attempt checkout
  - [ ] Verify 409 error returned
  - [ ] Verify error message correct

- [ ] **Monitor metrics**
  - [ ] Check logs for `inventory_hold_created` (should be 0)
  - [ ] Check logs for validation metrics
  - [ ] Verify no errors in logs

- [ ] **Run for 2-3 days**
  - [ ] Monitor error rates
  - [ ] Check for data inconsistencies
  - [ ] Gather feedback

### Phase 2: Reserve-TTL Mode (Week 2)

- [ ] **Update environment variables**
  ```bash
  INVENTORY_MODE=reserve_ttl
  INVENTORY_HOLD_TTL_SECONDS=600  # Start with 10 min
  ```

- [ ] **Deploy updated config**

- [ ] **Verify cron job deployed**
  ```bash
  # Check vercel.json or equivalent
  cat apps/cms/vercel.json | grep release-expired-holds
  ```

- [ ] **Test hold lifecycle**
  - [ ] Create checkout (hold created)
  - [ ] Check database: `SELECT * FROM "InventoryHold" ORDER BY "createdAt" DESC LIMIT 5`
  - [ ] Complete payment (hold committed)
  - [ ] Check database: Hold status = "committed"
  - [ ] Verify inventory reduced

- [ ] **Test hold release**
  - [ ] Create checkout (hold created)
  - [ ] Cancel payment (or let expire)
  - [ ] Check database: Hold status = "released" or "expired"
  - [ ] Verify inventory restored

- [ ] **Test reaper**
  - [ ] Wait for cron job to run (every 5 min)
  - [ ] Check logs for reaper execution
  - [ ] Verify expired holds cleaned up

- [ ] **Monitor metrics**
  - [ ] Hold creation rate
  - [ ] Hold commit rate (target: >80%)
  - [ ] Hold expiry rate (target: <20%)
  - [ ] Reaper performance

- [ ] **Adjust TTL if needed**
  - [ ] If high expiry rate: Increase TTL
  - [ ] If low expiry rate: Consider decreasing TTL
  - [ ] Monitor checkout duration (p95)

- [ ] **Run for 3-5 days**
  - [ ] Monitor all metrics
  - [ ] Check for race conditions
  - [ ] Verify no overselling
  - [ ] Gather performance data

---

## Production Deployment

### Pre-Production Checklist

- [ ] **Staging validation complete**
  - [ ] All tests passing
  - [ ] Metrics look healthy
  - [ ] No critical issues

- [ ] **Backups**
  - [ ] Database backup created
  - [ ] Rollback plan documented

- [ ] **Monitoring setup**
  - [ ] Dashboards created
  - [ ] Alerts configured
  - [ ] Runbooks available

- [ ] **Team notification**
  - [ ] Engineering team notified
  - [ ] Support team briefed
  - [ ] On-call schedule confirmed

### Production Deployment Steps

- [ ] **Deploy database migration**
  ```bash
  # Production database
  DATABASE_URL=postgresql://prod... pnpm --filter @acme/platform-core exec prisma migrate deploy
  ```

- [ ] **Deploy code**
  - [ ] CMS deployed
  - [ ] Shop apps deployed
  - [ ] Workers deployed (if applicable)

- [ ] **Verify deployment**
  - [ ] Health checks passing
  - [ ] No deployment errors
  - [ ] Services responding

- [ ] **Enable validate-only first**
  ```bash
  INVENTORY_MODE=validate_only
  ```

- [ ] **Monitor for 24 hours**
  - [ ] Watch error rates
  - [ ] Check validation metrics
  - [ ] Verify no issues

- [ ] **Enable reserve-ttl**
  ```bash
  INVENTORY_MODE=reserve_ttl
  INVENTORY_HOLD_TTL_SECONDS=1200  # 20 min
  ```

- [ ] **Monitor closely for 48 hours**
  - [ ] Hold creation rate
  - [ ] Commit/release rates
  - [ ] Expiry rate
  - [ ] Database performance
  - [ ] No overselling incidents

### Post-Deployment Validation

- [ ] **Smoke tests**
  - [ ] Complete end-to-end checkout
  - [ ] Verify hold created
  - [ ] Verify payment success commits hold
  - [ ] Verify inventory reduced

- [ ] **Check metrics**
  - [ ] `inventory_hold_created` > 0
  - [ ] `inventory_hold_committed` > 0
  - [ ] Hold commit rate > 80%
  - [ ] Hold expiry rate < 20%

- [ ] **Database queries**
  ```sql
  -- Check hold counts
  SELECT status, COUNT(*) FROM "InventoryHold"
  WHERE "createdAt" > NOW() - INTERVAL '24 hours'
  GROUP BY status;

  -- Check hold commit rate
  SELECT
    ROUND(100.0 * SUM(CASE WHEN status = 'committed' THEN 1 ELSE 0 END) / COUNT(*), 2) AS commit_rate_pct
  FROM "InventoryHold"
  WHERE "createdAt" > NOW() - INTERVAL '24 hours';

  -- Check average hold duration
  SELECT
    AVG(EXTRACT(EPOCH FROM ("committedAt" - "createdAt"))) AS avg_duration_sec
  FROM "InventoryHold"
  WHERE status = 'committed' AND "createdAt" > NOW() - INTERVAL '24 hours';
  ```

- [ ] **Alerts check**
  - [ ] Verify alerts firing correctly
  - [ ] Test alert channels (Slack, PagerDuty, etc.)

---

## Rollback Plan

### If Critical Issues Occur

- [ ] **Emergency bypass**
  ```bash
  # Disable inventory validation temporarily
  SKIP_INVENTORY_VALIDATION=1
  ```
  - Redeploy immediately
  - Notifies team
  - Investigation begins

- [ ] **Revert to validate-only**
  ```bash
  INVENTORY_MODE=validate_only
  ```
  - Less risky than full bypass
  - Still validates but doesn't hold

- [ ] **Full rollback**
  ```bash
  # Revert code to previous version
  git revert <commit-hash>
  git push
  # Deploy
  ```

### Rollback Checklist

- [ ] Set `SKIP_INVENTORY_VALIDATION=1` or revert mode
- [ ] Deploy immediately
- [ ] Notify team via Slack/PagerDuty
- [ ] Document issue (incident report)
- [ ] Release holds if needed:
  ```sql
  UPDATE "InventoryHold"
  SET status = 'released', "releasedAt" = NOW()
  WHERE status = 'active';
  ```

---

## Post-Deployment

### Week 1

- [ ] **Daily monitoring**
  - [ ] Check dashboards
  - [ ] Review metrics
  - [ ] Check error logs
  - [ ] Verify cron job running

- [ ] **Performance tuning**
  - [ ] Adjust TTL based on data
  - [ ] Optimize database queries if slow
  - [ ] Scale database if needed

### Week 2-4

- [ ] **Weekly reviews**
  - [ ] Review metrics trends
  - [ ] Check for issues
  - [ ] Gather user feedback

- [ ] **Documentation**
  - [ ] Update runbooks with learnings
  - [ ] Document common issues
  - [ ] Update team wiki

### Ongoing

- [ ] **Quarterly reviews**
  - [ ] Review metrics
  - [ ] Optimize performance
  - [ ] Update documentation

- [ ] **Team training**
  - [ ] Train support on inventory system
  - [ ] Update incident response procedures
  - [ ] Share learnings

---

## Success Criteria

### Technical Metrics

- [ ] Hold creation latency < 200ms (p95)
- [ ] Hold commit latency < 100ms (p95)
- [ ] Validation latency < 100ms (p95)
- [ ] Hold commit rate > 80%
- [ ] Hold expiry rate < 20%
- [ ] Zero overselling incidents
- [ ] Reaper running every 5 minutes
- [ ] Database CPU < 70%

### Business Metrics

- [ ] Checkout conversion unchanged or improved
- [ ] Customer complaints reduced (stock issues)
- [ ] Support tickets reduced (stock issues)
- [ ] No revenue impact
- [ ] Inventory accuracy > 99%

---

## Common Issues

### Issue: High expiry rate

**Symptoms:** Expiry rate > 30%

**Actions:**
1. Check average checkout duration
2. Increase TTL if checkouts legitimately slow
3. Investigate payment failures
4. Review checkout UX

### Issue: Low commit rate

**Symptoms:** Commit rate < 60%

**Actions:**
1. Check Stripe webhook delivery
2. Verify webhook handlers working
3. Check payment failure rates
4. Review cart abandonment

### Issue: Database lock contention

**Symptoms:** Many `inventory_hold_busy` errors

**Actions:**
1. Scale database (increase CPU/memory)
2. Add read replicas
3. Optimize queries
4. Increase lock timeout

### Issue: Cron job not running

**Symptoms:** Expired holds accumulating

**Actions:**
1. Check Vercel cron logs
2. Verify `CRON_SECRET` set correctly
3. Test endpoint manually
4. Check cron schedule in vercel.json

---

## References

- [Production Readiness Plan](./inventory-production-readiness.md)
- [Integration Guide](./inventory-integration-guide.md)
- [Monitoring Guide](./inventory-monitoring-guide.md)
- [Example Worker Integration](../examples/inventory-worker-integration.ts)

---

**Last Updated:** 2026-01-12
**Contact:** Platform Team | #inventory-system
