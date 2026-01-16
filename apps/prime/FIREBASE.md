# Firebase Configuration for Prime

This document describes Firebase Realtime Database configuration requirements for the Prime application.

## Database Structure

Prime uses Firebase Realtime Database with the following key nodes:

- `bookings/` - Reservation data with nested occupant records
- `guests/` - Guest profile information
- `activities/instances/` - Live and upcoming activities
- `preorders/` - Breakfast and other pre-orders
- `messages/` - Chat and notification messages

## Required Indexes

### Bookings by Occupant UUID

**Purpose:** Efficiently query bookings for a specific user without downloading the entire bookings table.

**Index Configuration:**

In the Firebase Console (Database > Rules tab), add this index to your `database.rules.json` or configure via the Firebase Console:

```json
{
  "rules": {
    "bookings": {
      ".indexOn": ["occupants"]
    }
  }
}
```

**Usage in Code:**

File: `apps/prime/src/hooks/pureData/useFetchBookingsData.ts`

```typescript
const q = query(
  bookingsRef,
  orderByChild(`occupants/${uuid}`),
  startAt(true)
);
const snapshot = await get(q);
```

**Impact:** Reduces data transfer from downloading entire bookings collection (potentially 100+ records) to only records matching the UUID (typically 1-2 records).

### Activities by Status

**Purpose:** Query live and upcoming activities without fetching completed/cancelled activities.

**Index Configuration:**

```json
{
  "rules": {
    "activities": {
      "instances": {
        ".indexOn": ["status"]
      }
    }
  }
}
```

**Usage Pattern:**

```typescript
const q = query(
  ref(db, 'activities/instances'),
  orderByChild('status'),
  startAt('live'),
  endAt('upcoming')
);
```

## Security Rules

Prime uses Firebase Authentication with custom token-based access control. Security rules should be configured to:

1. Require authentication for all reads/writes
2. Allow users to read their own bookings (via occupants/${uuid})
3. Restrict writes to administrative functions only

Example security rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null && auth.admin === true",
    "bookings": {
      "$bookingId": {
        "occupants": {
          "$userId": {
            ".read": "auth != null && auth.uid === $userId"
          }
        }
      }
    },
    "guests": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        ".write": "auth != null && auth.uid === $userId"
      }
    }
  }
}
```

## Environment Variables

Firebase configuration is provided via Next.js environment variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

See `.env.template` for current configuration.

## Performance Monitoring

Prime's Firebase SDK wrapper logs all queries with payload sizes:

```typescript
// File: apps/prime/src/services/firebase.ts
export async function get(queryRef: Query): Promise<DataSnapshot> {
  logger.debug(`[firebase] get ${queryRef.toString()}`);
  const snapshot = await fbGet(queryRef);
  const size = JSON.stringify(snapshot.val()).length;
  logger.debug(`[firebase] get complete ${queryRef.toString()} bytes=${size}`);
  return snapshot;
}
```

Enable debug logging to monitor query performance:

```bash
NEXT_PUBLIC_LOG_LEVEL=debug pnpm dev
```

## Optimization Status

See [docs/plans/prime-optimization-plan.md](../../docs/plans/prime-optimization-plan.md) for ongoing optimization work.

**Completed:**
- OPT-01: Fixed N+1 bookings query with indexed Firebase query

**In Progress:**
- OPT-02: Implementing React Query caching layer
- OPT-07: Adding comprehensive Firebase metrics

## Troubleshooting

### "Index not defined" Error

If you see an error like:

```
Index not defined, add ".indexOn": "occupants" at /bookings to the rules
```

This means the Firebase index hasn't been configured yet. Follow these steps:

1. Open Firebase Console → Your Project → Realtime Database
2. Click the "Rules" tab
3. Add the index configuration from the "Required Indexes" section above
4. Click "Publish"

Alternatively, the Firebase SDK will provide a direct link in the error message to automatically create the index.

### High Read Counts

If you're seeing unexpectedly high Firebase read counts:

1. Enable debug logging: `NEXT_PUBLIC_LOG_LEVEL=debug`
2. Check browser DevTools Network tab for Firebase WebSocket traffic
3. Review payload sizes in console logs (look for `[firebase] get complete ... bytes=`)
4. Consider implementing caching layer (see OPT-02 in optimization plan)

### Query Returns No Results

If a query returns no results when you expect data:

1. Verify the index is properly configured
2. Check that data exists at the expected path
3. Verify the query parameters match your data structure
4. Use Firebase Console's "Data" tab to inspect raw data

---

**Last Updated:** 2026-01-12
**Related Documentation:**
- [Prime Optimization Plan](../../docs/plans/prime-optimization-plan.md)
- [Prime Next.js Port Plan](../../docs/plans/prime-nextjs-port-plan.md)
