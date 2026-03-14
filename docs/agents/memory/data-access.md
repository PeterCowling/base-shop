# Data Store Access

## Firebase Realtime Database (prime-f3652)

**Project ID:** `prime-f3652`
**Database URL:** `https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app`
**Region:** europe-west1

### Access Methods

**Firebase CLI (preferred for admin operations):**
```bash
firebase database:get /path --project prime-f3652
firebase database:set /path -d '<json>' --project prime-f3652 --force
firebase database:update /path -d '<json>' --project prime-f3652 --force
```
CLI is logged in as `hostelpositano@gmail.com` — no additional auth needed.

**Firebase Auth user export:**
```bash
firebase auth:export /tmp/users.json --format=json --project prime-f3652
```

**REST API (read-only, client key):**
The `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local` is a client key — only works for
authenticated sessions, not admin-level writes.

### What the Store Contains

| Path | Description |
|---|---|
| `userProfiles/{uid}` | Staff user records: email, displayName, roles, createdAt, updatedAt |
| `cashCounts/{id}` | Till cash count records per shift |
| `safeCounts/{id}` | Safe count records |
| `tillShifts/{id}` | Till shift open/close records |
| `tillEvents/{id}` | Individual till events within a shift |
| `allFinancialTransactions/{id}` | All financial transaction records |
| `financialsRoom/{bookingRef}` | Per-booking financial summary (balance, totalPaid, totalDue) |
| `cashDiscrepancies/{id}` | Cash variance records |
| `keycardDiscrepancies/{id}` | Keycard variance records |
| `keycardTransfers/{id}` | Keycard handoff records |
| `keycardAssignments/{id}` | Current keycard-to-guest assignments |
| `creditSlips/{id}` | Credit slip records |
| `ccIrregularities/{id}` | Card irregularity records |
| `drawerAlerts/{id}` | Cash drawer alert records |
| `bookingMeta/{reservationCode}` | Booking metadata per reservation code |
| `inventory/items/{id}` | Inventory item definitions |
| `inventory/ledger/{id}` | Inventory movement ledger |
| `inventory/recipes/{id}` | Inventory recipes |
| `inventory/ingredients/{name}` | Ingredient definitions |
| `settings/cashDrawerLimit` | Current cash drawer limit setting |
| `settings/safeKeycards` | Safe keycard setting |
| `settings/varianceThresholds` | Variance threshold settings |
| `audit/financialTransactionAudits/{id}` | Financial transaction audit trail |
| `audit/settingChanges/{id}` | Settings change audit trail |
| `reconciliation/{collection}/{id}` | Reconciliation entries |

### Security Rules

Rules file: `apps/reception/database.rules.json`

- All reads require `auth != null`
- Root-level `.write` is `false` — all writes go through path-specific rules
- Most write rules require `owner` or `developer` role
- **Role format in DB:** stored as array (e.g. `["owner", "developer"]`), read by `normalizeRoles()` in `userDomain.ts`
- **Note:** security rules check `roles.child('owner').val() == true` (map form) — inconsistent with stored array form; role-based write gating effectively relies on Firebase Auth uid existence checks only

### Current Staff Profiles in `userProfiles/`

| UID | Name | Email | Roles |
|---|---|---|---|
| `L9kHr9poKBNuhaolqwyOnFDPeGA3` | Pete | peter.cowling1976@gmail.com | `["owner","developer"]` |
| `vr0jGiF1X6bWvd1EXaoApUKrTec2` | Cristiana | cmarzano@gmail.com | `["owner","admin"]` |

**No Firebase Auth accounts yet for:** Serena (sery399@gmail.com), Alessandro (ponticorvoalessandro@gmail.com).
Their `userProfiles` entries will be created when they first log in through the reception app.
Set their roles via CLI after their first login: Serena → `["owner"]`, Alessandro → `["staff"]`.

### PIN Roster (Build-Time Config)

Separate from Firebase — lives in `NEXT_PUBLIC_USERS_JSON` in `apps/reception/.env.local`.
Used for the device-PIN quick-unlock path. Not the authoritative source for RBAC at runtime.
See `apps/reception/.env.example` for format documentation.

## GA4 Analytics

Available via MCP tools (`mcp__brikette__analytics_*`) — pre-configured, no additional setup needed.

## BOS Agent API

- **Base URL**: `https://business-os.peter-cowling1976.workers.dev`
- **Auth header**: `x-agent-api-key`
- **Env var**: `BOS_AGENT_API_KEY` in `/Users/petercowling/base-shop/.env.local`
- **IMPORTANT**: Always `source /Users/petercowling/base-shop/.env.local` before any BOS API curl call — the Bash tool shell does NOT inherit the interactive shell environment
