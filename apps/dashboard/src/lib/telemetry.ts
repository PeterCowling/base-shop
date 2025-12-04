import { track as trackTelemetry } from "@acme/telemetry";

type TelemetryEventName =
  | "upgrade_diff_load_start"
  | "upgrade_diff_load_success"
  | "upgrade_diff_load_fail"
  | "upgrade_publish_start"
  | "upgrade_publish_success"
  | "upgrade_publish_fail"
  | "shops_index_load_start"
  | "shops_index_load_success"
  | "shops_index_load_fail"
  | "workboard_load_start"
  | "workboard_load_success"
  | "workboard_load_fail"
  | "history_load_start"
  | "history_load_success"
  | "history_load_fail";

type TelemetryPayload = Record<string, unknown>;

type TelemetrySink = (name: TelemetryEventName, payload?: TelemetryPayload) => void;

let sink: TelemetrySink | null = null;

export function setTelemetrySink(next: TelemetrySink) {
  sink = next;
}

export function trackEvent(name: TelemetryEventName, payload?: TelemetryPayload) {
  if (process.env.NODE_ENV === "test") return;
  const target = sink ?? defaultSink;
  target(name, payload);
}

function defaultSink(name: TelemetryEventName, payload?: TelemetryPayload) {
  try {
    // Route events to the shared telemetry client; it will no-op unless enabled.
    trackTelemetry(name, payload ?? {});
  } catch (err) {
    try {
      console.debug("[telemetry:fallback]", name, payload ?? {}, err);
    } catch {
      // Avoid crashing the UI if logging fails.
    }
    return;
  }

  // Preserve lightweight dev visibility without requiring the backend sink.
  try {
    console.debug("[telemetry]", name, payload ?? {});
  } catch {
    // Avoid crashing the UI if logging fails.
  }
}
