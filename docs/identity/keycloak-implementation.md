# Keycloak OIDC Implementation Plan (Multi-TLD)

Status: Draft blueprint → execution starter
Scope: Web storefronts (multi‑TLD), OIDC Authorization Code + PKCE, Keycloak as the IdP, first‑party sessions per storefront.

## Goals
- Shared customer accounts across storefronts via SSO (no cross-domain cookies).
- Guest-first checkout preserved; authentication is optional until after purchase.
- Canonical identifiers: `internalCustomerId` (derived from IdP identity) + `stripeCustomerId` mapping (one per Stripe account/env).
- Reliable redirects with modern SameSite behavior and CSRF posture.

## IdP / Realm
- Selected IdP: Keycloak (self-hosted).
- Realm: `TBD` (example: `skylar`).
- Issuer URL: `https://idp.example.com/realms/skylar` (placeholder; replace with real).
- Discovery URL: `${ISSUER}/.well-known/openid-configuration`.
- Clients: one OIDC client per storefront TLD; allowed redirect URIs set per storefront.

## Storefront OIDC Client (per domain)
- Flow: Authorization Code + PKCE.
- Redirect URIs: `https://{storefront}/auth/callback`.
- Post-logout redirect: `https://{storefront}/auth/logout-complete` (or home).
- Front-channel logout: optional; baseline is user-initiated logout → IdP logout → local session cleared.
- Scopes: `openid email profile` (extend if needed).

## Cookie / Session Posture
- Storefront session cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`.
- OIDC transaction state: stored server-side keyed by `state`; avoid relying on cookies during callback.
- Callback method: GET (`response_mode=query`) to align with SameSite=Lax.
- CSRF: all state-changing routes under cookie auth require CSRF tokens + Origin/Referer checks. Auth flow uses OIDC `state`/`nonce`.

## Identifier Invariants
- `internalCustomerId`: immutable, not derived from email. Recommend `{issuer}:{subject}` mapping stored alongside a stable internal UUID PK.
- `stripeCustomerId`: unique per `internalCustomerId` per Stripe account/env; created idempotently. If duplicates arise, select canonical and orphan the rest.
- Orders/metadata: always persist `internalCustomerId` + `stripeCustomerId` when authenticated; always persist `customer_email` for guests.

## Checkout Integration
- On authenticated checkout: attach `stripeCustomerId` to Stripe objects and include both identifiers in metadata; persist on orders.
- Mapping creation must be concurrency-safe (e.g., upsert on `internalCustomerId` with idempotency key).

## Endpoints (storefront)
- `GET /auth/login` → redirect to IdP with PKCE.
- `GET /auth/callback` → code exchange + session issue (server).
- `POST /auth/logout` → clear session + IdP logout redirect.
- `GET /api/me` → returns profile or 401.

## Migration / Linking
- Guest-first is preserved.
- Guest → account linking: explicit claim flow (e.g., link in confirmation email or order-number claim) to avoid accidental linkage by email alone.

## Operational Considerations
- IdP outage: blocks new logins/refresh; existing sessions continue until expiry if validated locally (no per-request introspection).
- Logging/Audit: log auth events, failed logins, and session lifecycle; rotate secrets/keys per policy.
- Rate limiting: apply to auth endpoints to reduce abuse.

## Next Steps (execution)
- Stand up Keycloak realm and clients; record real issuer/redirect URIs.
- Add storefront auth routes and session middleware implementing the above cookie/CSRF posture.
- Implement `internalCustomerId`/`stripeCustomerId` mapping service with idempotent creation.
- Add conformance tests: login flow, callback SameSite behavior, session issuance, CSRF on state-changing routes, and mapping persistence in checkout.
