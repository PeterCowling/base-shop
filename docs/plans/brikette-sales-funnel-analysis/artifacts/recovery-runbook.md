# Brikette Recovery MVP Runbook (Email-Only)

- Task: `TASK-11`
- Date: `2026-03-01`
- Scope: email-only recovery capture with query resume links and proxy audience telemetry.

## Contract

1. Capture entry appears only when booking context is valid (`checkin`, `checkout`, `pax` pass hostel policy).
2. User must provide email and explicit consent before capture submit.
3. Resume links include booking query and `rq_exp_ms` and expire after 7 days.
4. Expired resume links clear booking query and show `Rebuild your quote` guidance.
5. Stored recovery payload includes booking context + consent metadata only (no child attributes, no payment data).

## Stored Payload Schema

Local storage key: `brikette.recovery_capture.v1`

Fields:
- `lead_capture_id`
- `checkin`
- `checkout`
- `pax`
- `source_route`
- `room_id` (optional)
- `rate_plan` (optional)
- `resume_link`
- `resume_expires_at`
- `recovery_channel` (`email`)
- `consent_version` (`2026-03-01-email-recovery-v1`)
- `consent_granted_at`
- `retention_expires_at` (30-day retention target)

## Telemetry

Events:
- `recovery_lead_capture`
- `recovery_proxy_signal` with `signal_type=lead_capture`
- `recovery_proxy_signal` with `signal_type=handoff` (fired alongside canonical handoff events)

## Operational Notes

- Dispatch is mailto-based for MVP; no backend job queue is introduced in this tranche.
- User sends the generated email draft from their own client.
- If `rq_exp_ms` is expired, booking params are removed from URL and local booking continuity store is cleared.

## Follow-up (Post-MVP)

1. Replace mailto capture with server dispatch once consent + retention legal controls are signed.
2. Add data deletion worker for records past `retention_expires_at`.
3. Promote proxy audience to deterministic join only if click-id export persistence becomes available.
