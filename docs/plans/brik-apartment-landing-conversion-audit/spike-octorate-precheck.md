---
Type: Spike-Artifact
Task: TASK-16
Status: Complete
Conclusion: INCAPABLE (direct lightweight precheck)
Owner: BRIK engineering
Completed: 2026-02-17
---

# Spike: Octorate API Availability Precheck Capability

## Conclusion

**INCAPABLE** — no lightweight availability precheck call is feasible from the Brikette Next.js app without Octorate operator credentials and significant server-side infrastructure.

The `availability_no_result` GA4 event (as originally scoped) cannot be implemented in TASK-09. TASK-09's narrowed scope (WhatsApp prefill, long-stay reroute, `whatsapp_click` event) is confirmed correct.

---

## Evidence

### What Octorate exposes

**Partner REST API** (`api.octorate.com/connect/rest/v1`)

Octorate has a documented REST API (OpenAPI spec at `api.octorate.com/connect/rest/v1/integration/openapi.yaml`). It covers:
- Property/accommodation management
- Reservation read/write
- ARI (Availability & Rates Inventory) push/pull to connected OTAs
- Webhook subscriptions for ARI changes

**Blockers for guest-facing precheck use:**

| Blocker | Detail |
|---|---|
| OAuth2 required | `client_id` + `client_secret` issued by Octorate to registered partners — cannot be exposed frontend |
| No pull-by-date endpoint | ARI endpoints are push/webhook-based, not query-by-date-range REST |
| Operator-only scope | API scope covers the accommodation operator, not individual guest availability queries |
| Rate limit | 100 calls / 5 minutes per accommodation even with credentials |

**Booking engine UI** (`book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111`)

The UI is Java Server Faces (JSF) with PrimeFaces AJAX. The availability check is a `POST` to the same `.xhtml` page via JSF partial page update protocol (`javax.faces.partial.ajax=true`). Response is JSF XML fragments — not JSON, not a stable contract.

```javascript
// JSF AJAX call in booking engine (not usable externally)
searchRooms = function() {
  return PrimeFaces.ab({
    s: "SiteHeader3:j_idt438",
    f: "SiteHeader3",
    p: "SiteHeader3",
    pa: arguments[0]
  });
}
```

**CORS**: `book.octorate.com` is a separate origin with no CORS headers for cross-origin XHR.

---

## Viable Alternatives

### Option A: sessionStorage redirect-back UX (recommended — zero dependencies)

Before `window.location.assign(octorateUrl)`, store `{checkin, checkout, plan}` in `sessionStorage`. When user returns (detectable via `document.referrer` containing `octorate` or via `pageshow`/`visibilitychange`), restore UI state and surface fallback messaging.

- **Pros**: No credentials, no server infrastructure, zero Octorate API dependency.
- **Cons**: Cannot confirm actual unavailability (user might return for any reason). Best used for UX continuity (pre-fill dates on return), not as an `availability_no_result` signal.
- **`availability_no_result` fire condition**: Cannot be determined reliably from redirect-back alone.

### Option B: iCal feed (server-side cache, property owner credentials required)

Octorate publishes iCal feeds for connected OTAs. If the property owner retrieves the iCal URL from the Octorate dashboard, a Next.js server action can:
1. Fetch the iCal feed on a schedule (e.g. every 30 min).
2. Cache the blocked date ranges.
3. Serve an availability response from the cache.

- **Pros**: Gives real blocked/available signal (no pricing). `availability_no_result` event becomes feasible.
- **Cons**: Requires property owner to supply iCal URL. No pricing data. Stale by up to 30 min.
- **Implementation estimate**: M effort (server action + caching + availability UI integration).

### Option C: Octorate Partner API + ARI webhook (full integration, significant effort)

If Brikette registers as an Octorate partner and receives OAuth credentials:
- Subscribe to `PORTAL_SUBSCRIPTION_CALENDAR` webhooks.
- Maintain local availability cache in D1/KV.
- Query own cache from Next.js app.

- **Pros**: Real-time availability with pricing signals possible.
- **Cons**: Requires Octorate partner registration (process unclear), L effort, ongoing credential management.

---

## Impact on TASK-09

| TC | Status after spike |
|---|---|
| TC-01 (WhatsApp prefill) | **Confirmed feasible** — no Octorate API needed |
| TC-02 (`whatsapp_click` event) | **Confirmed feasible** — extends existing GA4 pattern |
| TC-03 (long-stay reroute) | **Confirmed feasible** — date math only |
| TC-04 (pricing policy check) | **Confirmed feasible** — source check only |
| `availability_no_result` event (deferred) | **Not feasible without Option B or C** |

TASK-09 proceeds at narrowed scope. If Option B (iCal) is desired, create a new IMPLEMENT task with property owner supplying the iCal URL as a precondition.

---

## Recommendation

Proceed with TASK-09 at narrowed scope (WhatsApp prefill, long-stay reroute, `whatsapp_click` event).

For `availability_no_result` event: evaluate Option B (iCal cache) as a separate future task once the property owner retrieves the iCal URL from the Octorate dashboard. Do not block TASK-09 or TASK-12 on this.

---

## Sources

- Octorate Integration Central: `https://api.octorate.com/connect/`
- Octorate OpenAPI spec: `https://api.octorate.com/connect/rest/v1/integration/openapi.yaml`
- Octorate iCal Connection: `https://octorate.com/en/ical-connection/`
- Booking engine probe: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111`
