# Writer Lock Stale Locks from Subagents - Fact Find

**Status:** Investigation
**Date:** 2026-02-06
**Context:** Encountered during i18n translation work (travelHelp batch)

---

## Problem Statement

Subagents spawned via the Task tool are leaving **stale writer locks** that block subsequent git operations, even after the subagent processes have terminated.

## Symptoms Observed

1. **Git commit blocked** with error:
   ```
   BLOCKED: writer lock token missing or mismatched
   A writer lock exists, but your current shell does not own it.
   ```

2. **Lock holder process is dead**:
   - Lock shows PID 93722, then 96001 after attempted release
   - `ps -p <PID>` confirms processes are not running
   - Lock file persists despite dead processes

3. **Multiple stale locks accumulated**:
   - First lock: PID 93722 (started earlier in session)
   - Second lock: PID 96001 (started at 20:48:49Z)
   - Both created by parallel translation subagents

## Context & Timeline

**Session Activity:**
1. Spawned 4 parallel Task tool subagents for travelHelp translations (hi/hu/it/ja, ko/no/pl/pt, ru/sv/vi/zh)
2. Spawned 3 parallel Task tool subagents for lauritoBeachGuide translations (es/de/fr, ko/no/pl, sv/vi/zh)
3. All agents completed successfully and reported completion
4. Attempted to commit results → blocked by stale lock

**Lock Acquisition Pattern:**
- Subagents likely acquire writer locks when they perform git operations
- Lock tokens stored but not accessible to parent process
- Subagent completion doesn't trigger automatic lock release
- Parent process cannot release locks it doesn't own

## Root Cause Analysis

### Current Writer Lock Design

From `MEMORY.md`:
> **Writer lock**: NEVER bypass with `SKIP_WRITER_LOCK=1`. Always acquire properly via `scripts/agents/with-writer-lock.sh`. The lock protects against concurrent agents clobbering work.

Lock script commands:
```bash
scripts/git/writer-lock.sh status
scripts/git/writer-lock.sh acquire [--wait] [--timeout <sec>] [--poll <sec>] [--force]
scripts/git/writer-lock.sh release [--force]
```

### Gap Identified

**Problem:** Subagents spawned via Task tool:
- May acquire locks during their work
- Do not export lock tokens to parent process
- Cannot have their locks released by parent on completion
- Leave stale locks if process terminates without cleanup

**No Automatic Cleanup:**
- Lock system doesn't detect dead processes
- No timeout-based expiration
- No automatic cleanup on process exit

## Current Workarounds

### Option 1: Force Release (Emergency)
```bash
SKIP_WRITER_LOCK=1 scripts/git/writer-lock.sh release --force
```
**Risk:** Bypasses safety mechanism (conflicts with MEMORY.md guidance)

### Option 2: Wrapper Script
```bash
scripts/agents/with-writer-lock.sh git commit -m "..."
```
**Issue:** May still fail if stale lock exists

### Option 3: Manual Bypass
```bash
SKIP_WRITER_LOCK=1 git commit -m "..."
```
**Risk:** Bypasses safety completely

## Impact Assessment

**Severity:** High - Blocks all git write operations after subagent work

**Frequency:** Occurred during normal parallel translation workflow

**Workaround Complexity:** Requires manual intervention with bypass flag

**Safety Implications:**
- Legitimate use case for SKIP_WRITER_LOCK=1 (stale lock cleanup)
- But conflicts with "NEVER bypass" guidance in MEMORY.md
- Need clearer policy on when bypass is appropriate

## Investigation Questions

1. **Do subagents need to acquire writer locks at all?**
   - What git operations do translation subagents perform?
   - Can they work read-only until parent commits?

2. **Should subagents inherit parent lock token?**
   - Can Task tool pass lock token to spawned agents?
   - Would shared token create new race conditions?

3. **Should lock system detect dead processes?**
   - Add staleness detection (process liveness check)
   - Automatic cleanup after timeout period
   - Make `acquire` more resilient to stale locks

4. **Should subagents use different lock strategy?**
   - Nested locks (parent holds, children share)
   - Separate lock namespace for subagents
   - Lock-free read-only subagent pattern

## Proposed Solutions

### Short-term: Clarify Bypass Policy

**Update MEMORY.md** to distinguish:
- ❌ NEVER bypass for concurrent work
- ✅ ALLOWED bypass for stale lock cleanup from dead processes
- ✅ ALLOWED bypass with `--force` when process liveness confirmed dead

**Detection Command:**
```bash
# Safe stale lock cleanup pattern
LOCK_PID=$(scripts/git/writer-lock.sh status | grep -oP 'pid=\K\d+')
if ! ps -p "$LOCK_PID" > /dev/null 2>&1; then
  echo "Lock holder PID $LOCK_PID is dead, safe to force release"
  SKIP_WRITER_LOCK=1 scripts/git/writer-lock.sh release --force
fi
```

### Medium-term: Auto-Detect Stale Locks

**Enhance `writer-lock.sh acquire`:**
- Check if lock holder PID exists before blocking
- Offer automatic cleanup of stale locks
- Add `--clean-stale` flag to acquire command

### Long-term: Subagent Lock Strategy

**Option A: Read-Only Subagents**
- Subagents work on files but don't commit
- Parent process commits all changes after subagents complete
- Requires: subagent output to be file-based (already true for translations)

**Option B: Shared Lock Token**
- Parent acquires lock, exports WRITER_LOCK_TOKEN env var
- Task tool passes env vars to subagents
- Subagents use parent's token (shared lock)
- Requires: Task tool env var inheritance

**Option C: Lock-Free Writes**
- Review if writer lock is necessary for i18n translation work
- Translation writes are to separate locale files (low conflict risk)
- Consider lock-free for specific file patterns

## Recommended Actions

1. **Immediate:** Document safe stale lock cleanup pattern in MEMORY.md
2. **Short-term:** Add stale lock detection to `writer-lock.sh acquire`
3. **Medium-term:** Investigate subagent git operation patterns (do they need locks?)
4. **Long-term:** Design shared lock token strategy for parent/child agents

## Related Issues

- **Translation workflow:** Parallel subagents are essential for performance (17 locales × 3-4 batches)
- **Agent coordination:** Task tool creates isolated processes (no token inheritance)
- **Safety vs. throughput:** Lock system prioritizes safety but impacts parallel workflows

## Files Referenced

- `.git/writer-lock.json` - Lock state (ephemeral, not always present)
- `scripts/git/writer-lock.sh` - Lock management script
- `scripts/agents/with-writer-lock.sh` - Wrapper for lock acquisition
- `MEMORY.md` - Contains "NEVER bypass" guidance

---

**Next Steps:** Review with team to decide on stale lock detection strategy and update MEMORY.md guidance.
