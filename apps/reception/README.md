# Reception app

## Email automation

Reception email drafts for bookings can route through the MCP server to reuse the shared email template engine and logging.

### MCP booking email routing

- API route: `POST /api/mcp/booking-email`
- Feature flag: `NEXT_PUBLIC_MCP_BOOKING_EMAIL_ENABLED` — currently dead code; the route is always active.
- The MCP route invokes the `@acme/mcp-server/booking-email` helper.

### MCP guest email activity routing

Triggered automatically by the booking activity workflow for supported activity codes.

- API route: `POST /api/mcp/guest-email-activity`
- Supported activity codes:

| Code | Trigger |
|------|---------|
| 2 | Terms Reminder – Action Required |
| 3 | Final Terms Reminder – Action Required |
| 4 | Why Pre-paid Booking Type Cancelled |
| 5 | Prepayment – 1st Attempt Failed |
| 6 | Prepayment – 2nd Attempt Failed |
| 7 | Prepayment – Cancelled post 3rd Attempt |
| 8 | Prepayment Successful |
| 21 | Agreement Received |
| 27 | Cancellation Confirmation |

- Unsupported codes return `status: deferred` and are logged to telemetry.
- The route calls `sendGuestEmailActivity` from `packages/mcp-server/src/tools/guest-email-activity.ts` directly (not via MCP transport).

### Notes

- Activity code logging uses the existing Firebase workflow.
