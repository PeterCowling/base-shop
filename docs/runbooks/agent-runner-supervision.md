---
Type: Runbook
Status: Reference
Last-updated: 2026-02-05
---
# Agent Runner Daemon Supervision Strategy

**Version:** 1.0
**Last Updated:** 2026-01-30
**Applies To:** Business OS Multi-User MVP-E3

## Overview

The agent runner daemon (`agent-runner`) polls the queue directory for pending tasks and executes agent skills on behalf of users. This runbook defines supervision, monitoring, and recovery strategies.

## Supervision Architecture

### Process Manager: PM2

PM2 manages daemon lifecycle, restarts, and monitoring.

**Why PM2:**
- Battle-tested Node.js process manager
- Built-in restart policies
- Memory/CPU monitoring
- Log aggregation
- Graceful shutdown support
- Zero-downtime reloads

### PM2 Configuration

**File:** `apps/business-os/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'agent-runner',
    script: 'dist/agent-runner/daemon.js',
    cwd: './apps/business-os',
    instances: 1,  // Single instance (lock serialization)
    exec_mode: 'fork',

    // Restart policy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,  // 5 seconds

    // Memory limits
    max_memory_restart: '500M',

    // Logging
    error_file: '../../logs/agent-runner-error.log',
    out_file: '../../logs/agent-runner-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Environment
    env: {
      NODE_ENV: 'production',
      AGENT_QUEUE_DIR: 'docs/business-os/agent-queue',
      AGENT_RUNS_DIR: 'docs/business-os/agent-runs',
      REPO_ROOT: process.cwd(),
      POLL_INTERVAL_MS: '5000',
    },

    // Graceful shutdown
    kill_timeout: 30000,  // 30 seconds
    wait_ready: true,
    listen_timeout: 10000,
  }]
};
```

## Startup

### Development

```bash
# Build daemon
pnpm build:daemon

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

### Production

```bash
# Build
pnpm build

# Start daemon
pm2 start ecosystem.config.js --env production

# Save PM2 state
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Monitoring

### Health Check

**Status file:** `docs/business-os/agent-runs/.health`

**Format:**
```json
{
  "status": "healthy",
  "lastPoll": "2026-01-30T14:30:00Z",
  "activeTasks": 1,
  "completedTasks": 42,
  "failedTasks": 2,
  "uptime": 3600,
  "pid": 12345
}
```

**Health states:**
- `healthy`: Last poll <30s ago, no errors
- `degraded`: Last poll 30-60s ago (warn)
- `unhealthy`: Last poll >60s ago or consecutive errors

**Check script:**
```bash
#!/bin/bash
HEALTH_FILE="docs/business-os/agent-runs/.health"

if [ ! -f "$HEALTH_FILE" ]; then
  echo "ERROR: Health file missing"
  exit 1
fi

LAST_POLL=$(jq -r '.lastPoll' "$HEALTH_FILE")
LAST_POLL_TS=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_POLL" "+%s" 2>/dev/null || echo 0)
NOW_TS=$(date +%s)
AGE=$((NOW_TS - LAST_POLL_TS))

if [ "$AGE" -gt 60 ]; then
  echo "ERROR: Daemon stale (last poll ${AGE}s ago)"
  exit 1
elif [ "$AGE" -gt 30 ]; then
  echo "WARN: Daemon degraded (last poll ${AGE}s ago)"
  exit 0
else
  echo "OK: Daemon healthy (last poll ${AGE}s ago)"
  exit 0
fi
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Detailed info
pm2 show agent-runner

# Logs (live tail)
pm2 logs agent-runner

# Logs (recent 100 lines)
pm2 logs agent-runner --lines 100

# Memory/CPU stats
pm2 describe agent-runner
```

### Metrics

**Key metrics:**
- **Poll frequency:** Every 5 seconds (normal)
- **Task execution time:** <60s per task (typical)
- **Memory usage:** <200MB steady state
- **CPU usage:** <10% idle, <50% during execution
- **Queue depth:** <10 tasks (normal), >50 (investigate)
- **Failure rate:** <5% (normal), >20% (investigate)

**Alerting thresholds:**
- Memory >400MB → warn
- Memory >500MB → restart
- CPU >80% for >5min → warn
- Queue depth >100 → warn
- Failure rate >50% → page
- Health check failed for >2min → page

## Restart Policies

### Automatic Restarts

PM2 restarts daemon on:
- Exit with non-zero code
- Memory exceeds 500MB
- Process crashes

**Restart limits:**
- Max 10 restarts in 10 minutes
- If limit exceeded → exponential backoff (5s, 10s, 20s, 40s, ...)

### Manual Restarts

```bash
# Graceful restart (waits for current task)
pm2 reload agent-runner

# Immediate restart
pm2 restart agent-runner

# Stop daemon
pm2 stop agent-runner

# Delete from PM2
pm2 delete agent-runner
```

### Graceful Shutdown

Daemon handles `SIGTERM` and `SIGINT`:

1. Set `shutting_down` flag (new tasks rejected)
2. Wait for active task to complete (max 30s)
3. Release any held locks
4. Write final health status
5. Exit with code 0

**If task takes >30s:**
- PM2 sends `SIGKILL` after 30s
- Lock auto-expires after TTL (30s)
- Task marked as failed in run log

## Failure Scenarios

### Daemon Crashes

**Symptoms:** PM2 shows restarts, error logs

**Recovery:**
1. PM2 auto-restarts daemon (up to 10 times)
2. Check error logs: `pm2 logs agent-runner --err`
3. Check run logs for failed task: `cat docs/business-os/agent-runs/{task-id}/run.log.md`
4. Fix underlying issue (code bug, dependency, etc.)
5. Deploy fix and restart: `pm2 reload agent-runner`

**Lock handling:**
- Crashed daemon's lock expires after 30s (TTL)
- Next poll recovers stale lock if process dead
- No manual intervention needed

### Queue Starvation

**Symptoms:** Tasks stuck in pending, no execution

**Diagnosis:**
```bash
# Check daemon status
pm2 list | grep agent-runner

# Check health
cat docs/business-os/agent-runs/.health | jq

# Check queue
ls -la docs/business-os/agent-queue/

# Check locks
ls -la docs/business-os/.locks/
```

**Recovery:**
1. If daemon stopped: `pm2 restart agent-runner`
2. If lock held: Wait 30s for TTL, or manually remove `docs/business-os/.locks/repo.lock` (dangerous - verify no active git operations)
3. If queue file malformed: Fix frontmatter or move to `.invalid/`

### Memory Leaks

**Symptoms:** Memory usage grows over time, OOM restarts

**Diagnosis:**
```bash
# Check memory trend
pm2 describe agent-runner | grep memory

# Heap snapshot (requires --inspect)
pm2 restart agent-runner --node-args="--inspect"
# Then use Chrome DevTools to capture heap snapshot
```

**Recovery:**
1. Temporary: Restart daemon: `pm2 restart agent-runner`
2. Permanent: Fix code leak, redeploy

**Mitigation:**
- PM2 auto-restarts at 500MB threshold
- Weekly scheduled restart: `pm2 restart agent-runner` (cron)

### Stale Locks

**Symptoms:** Tasks not executing, lock file present

**Diagnosis:**
```bash
# Check lock file
cat docs/business-os/.locks/repo.lock | jq

# Check if process alive
ps -p <pid>
```

**Recovery:**
1. If process dead: Wait 30s for TTL, daemon auto-recovers
2. If process alive but hung: `kill -9 <pid>`, then `pm2 restart agent-runner`
3. If urgent: Manually remove lock (ensure no git operations active)

### Disk Full

**Symptoms:** Log writes fail, queue writes fail

**Recovery:**
```bash
# Check disk space
df -h

# Rotate logs
pm2 flush agent-runner

# Clean old run logs (retention: 30 days)
find docs/business-os/agent-runs -name "run.log.md" -mtime +30 -delete
```

## Log Rotation

**PM2 log rotation:**
```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

**Run logs:**
- Retention: 30 days
- Location: `docs/business-os/agent-runs/{task-id}/run.log.md`
- Manual cleanup: `find docs/business-os/agent-runs -name "run.log.md" -mtime +30 -delete`

## Upgrade Procedure

### Zero-Downtime Reload

```bash
# Build new version
pnpm build

# Reload daemon (graceful)
pm2 reload agent-runner
```

**Behavior:**
1. PM2 sends `SIGTERM` to old process
2. Old process finishes active task (max 30s)
3. PM2 starts new process
4. New process begins polling

**Downtime:** <30s (time to finish active task)

### Breaking Changes

If config changes require downtime:

```bash
# Stop daemon
pm2 stop agent-runner

# Update config
vim ecosystem.config.js

# Restart with new config
pm2 restart agent-runner
```

## Observability

### Logs

**PM2 logs:**
- Stdout: `logs/agent-runner-out.log`
- Stderr: `logs/agent-runner-error.log`
- Rotation: 10MB, retain 7 files

**Run logs:**
- Per-task: `docs/business-os/agent-runs/{task-id}/run.log.md`
- Format: Markdown with frontmatter (Status, Started, Completed, Duration, Error)

### Metrics

**Expose via health file:**
- Active tasks count
- Completed tasks count
- Failed tasks count
- Uptime
- Last poll timestamp

**Future (Phase 1):**
- Prometheus exporter
- Grafana dashboard
- Alertmanager integration

### Alerts

**Critical (page):**
- Daemon down for >2min
- Failure rate >50%
- Health check failed

**Warning (Slack):**
- Memory >400MB
- CPU >80% for >5min
- Queue depth >100

**Info (log):**
- Daemon started/stopped
- Task completed
- Lock recovered

## Runbook Checklist

### Daily

- [ ] Check PM2 status: `pm2 list`
- [ ] Check health: `cat docs/business-os/agent-runs/.health | jq`
- [ ] Check error logs: `pm2 logs agent-runner --err --lines 50`

### Weekly

- [ ] Review metrics (task counts, failure rate, uptime)
- [ ] Clean old run logs (>30 days)
- [ ] Restart daemon (preventive): `pm2 reload agent-runner`

### Monthly

- [ ] Review restart count and patterns
- [ ] Audit queue file formats (malformed detection)
- [ ] Update this runbook with new learnings

## Troubleshooting Guide

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Tasks not executing | Daemon stopped | `pm2 restart agent-runner` |
| Memory growing | Leak in skill code | Heap snapshot, fix leak |
| Frequent restarts | Crash loop | Check error logs, fix code |
| Lock file stuck | Process hung/dead | Check process, wait 30s or manual remove |
| Queue depth growing | Slow tasks or crash | Check run logs, optimize or fix |
| Health check stale | Polling loop hung | Restart daemon |
| Disk full | Logs not rotated | Rotate logs, clean old runs |

## Phase 0 Constraints

- **Single instance:** Only one daemon process (lock serialization, no distributed queue)
- **Manual ops:** No automated scaling/deployment
- **Pete-triggered:** All operations initiated by Pete
- **File-based:** Queue and locks use filesystem (no database)
- **Local-only:** No remote queue or distributed locks

## Future Enhancements

- **Phase 1:** Prometheus metrics, Grafana dashboards, automated alerts
- **Phase 2:** Distributed queue (Redis/PostgreSQL), multi-instance support
- **Phase 3:** Auto-scaling based on queue depth, blue-green deployments
