# Reception app

## Email automation

Reception email drafts for bookings can route through the MCP server to reuse the shared email template engine and logging.

### MCP booking email routing

- API route: `POST /api/mcp/booking-email`
- Feature flag: set `NEXT_PUBLIC_MCP_BOOKING_EMAIL_ENABLED=true` to enable MCP routing.
- Fallback: when disabled, the app uses the existing Apps Script (GAS) endpoint.

### Notes

- The MCP route invokes the `@acme/mcp-server/booking-email` helper.
- Activity code logging continues to use the existing Firebase workflow.
