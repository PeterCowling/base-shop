---
Type: Reference
Status: Active
Domain: Repo
Last-reviewed: 2026-02-23
---

# Prototype Benchmark Summary

Generated: 2026-02-23T11:29:32.021Z
Prototype: `/Users/petercowling/base-shop/docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`

This benchmark uses local Playwright browser engines and device emulation. It is useful for relative performance checks, but it does not replace real-device Safari/Chrome measurements.

## Per Run

| Profile | Particles | avg fps | p95 frame ms | long frame % | max frame ms | Screenshot |
|---|---:|---:|---:|---:|---:|---|
| desktop-chromium | 300 | 120.1 | 9 | 0 | 9.4 | `screenshots/desktop-chromium-300.png` |
| desktop-chromium | 500 | 120.2 | 8.9 | 0 | 9.3 | `screenshots/desktop-chromium-500.png` |
| desktop-chromium | 800 | 120.4 | 9.2 | 0 | 9.4 | `screenshots/desktop-chromium-800.png` |
| android-chrome-emulated | 300 | 120.1 | 9.2 | 0 | 9.4 | `screenshots/android-chrome-emulated-300.png` |
| android-chrome-emulated | 500 | 120.1 | 9.3 | 0 | 9.4 | `screenshots/android-chrome-emulated-500.png` |
| android-chrome-emulated | 800 | 120.1 | 9.2 | 0 | 9.4 | `screenshots/android-chrome-emulated-800.png` |
| ios-webkit-emulated | 300 | 60.2 | 18 | 61.7 | 20 | `screenshots/ios-webkit-emulated-300.png` |
| ios-webkit-emulated | 500 | 60.2 | 18 | 60.1 | 19 | `screenshots/ios-webkit-emulated-500.png` |
| ios-webkit-emulated | 800 | 60.1 | 18 | 58.9 | 18 | `screenshots/ios-webkit-emulated-800.png` |

## Profile Aggregates

| Profile | Runs | mean avg fps | median avg fps | mean p95 frame ms | mean long frame % |
|---|---:|---:|---:|---:|---:|
| desktop-chromium | 3 | 120.3 | 120.2 | 9.03 | 0 |
| android-chrome-emulated | 3 | 120.1 | 120.1 | 9.23 | 0 |
| ios-webkit-emulated | 3 | 60.2 | 60.2 | 18 | 60.2 |

## Notes

- This run provides H1 baseline evidence under local engine emulation.
- Keep a separate real-device pass for iPhone Safari and Android Chrome before final build sign-off.
