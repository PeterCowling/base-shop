# Migration: Move templates out of @acme/ui

This folder contains app/domain templates (e.g., ProductDetail, Checkout, Order*).
It should live in the `@acme/templates` package and be tested at the app/domain level (`apps/cms`).

While migration is in progress, the `packages/ui` coverage excludes this folder.
