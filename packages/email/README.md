# @acme/email

Utilities for sending campaign and transactional emails.

## Environment variables

- `SENDGRID_MARKETING_KEY` – API key for SendGrid's Marketing Campaigns API.
- `RESEND_API_KEY` – API key for Resend (requires send and schedule scopes).
- `EMAIL_PROVIDER` – Set to `sendgrid` or `resend` to select a provider.
- `CAMPAIGN_FROM` – Default sender address for campaign emails.
