import type { TrackFn } from "./types";

let telemetryTrack: TrackFn = () => {};

void import("@acme/telemetry")
  .then((module) => {
    telemetryTrack = module.track;
  })
  .catch(() => {
    // telemetry is optional in tests
  });

export const trackEvent: TrackFn = (name, payload) => {
  telemetryTrack(name, payload);
};
