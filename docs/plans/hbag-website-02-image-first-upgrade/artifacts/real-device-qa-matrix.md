# HBAG WEBSITE-02 Real-Device QA Matrix

Date: 2026-02-23  
Owner: Pete  
Status: Pending operator execution

## Scope

Validate image-first launch behavior on real devices before production rollout.

## Device Matrix

| Device | OS | Browser | Status |
|---|---|---|---|
| iPhone 13 | iOS 18.x | Safari | Pending |
| iPhone SE (2nd gen) | iOS 17.x | Safari | Pending |
| Pixel 8 | Android 15 | Chrome | Pending |
| MacBook (desktop) | macOS 15.x | Safari | Pending |
| MacBook (desktop) | macOS 15.x | Chrome | Pending |

## Pass Criteria

- Homepage hero and family hub images load without broken placeholders.
- PLP renders 2-up on mobile and 4-up on desktop with correct family filtering.
- PDP gallery supports swipe (touch), arrow controls, and keyboard left/right.
- Add-to-cart and checkout CTA remain visible and clickable across breakpoints.
- No blocking console errors during home -> PLP -> PDP -> checkout path.
- No severe jank observed during first interaction sequence on tested devices.

## Test Script

1. Open `/<lang>` and verify hero + family hubs.
2. Open `/<lang>/shop` and cycle family filters (`top-handle`, `shoulder`, `mini`).
3. Open any PDP and test gallery controls:
   - Tap Previous/Next
   - Swipe left/right
   - Keyboard arrows (desktop)
4. Confirm proof checklist and related silhouettes still render.
5. Add item to bag and validate checkout CTA path.

## Evidence Artifacts (required)

Store captures in `docs/plans/hbag-website-02-image-first-upgrade/artifacts/device/`:

- `<device>-home.mp4`
- `<device>-plp.mp4`
- `<device>-pdp-gallery.mp4`
- `<device>-checkout-path.mp4`
- `<device>-notes.md`

## Result Log

| Device | Verdict | Issues | Artifact Set |
|---|---|---|---|
| iPhone 13 / Safari | Pending | - | Pending |
| iPhone SE / Safari | Pending | - | Pending |
| Pixel 8 / Chrome | Pending | - | Pending |
| macOS Safari | Pending | - | Pending |
| macOS Chrome | Pending | - | Pending |

## Exit Rule

Promote to launch-ready only when all rows are `Pass` or when known issues are documented with explicit severity and accepted by operator.
