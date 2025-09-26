"use client";

import * as React from "react";

export interface ExperimentGateProps {
  /** Optional flag key, e.g., "hdr-v1:search". Can be toggled via URL or localStorage. */
  flag?: string;
  /** Quick on/off override; when provided it takes precedence over flag. */
  enabled?: boolean;
  /** Optional fallback to render when gate is disabled. */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Minimal experiment/feature gate.
 *
 * Resolution order (first match wins):
 * - explicit `enabled` prop
 * - query param: `?exp-<flag>=on|off`
 * - localStorage: `exp:<flag>` → "on" | "off"
 * - default: enabled
 */
export default function ExperimentGate({ flag, enabled, fallback = null, children }: ExperimentGateProps) {
  const [allow, setAllow] = React.useState<boolean>(enabled ?? true);

  React.useEffect(() => {
    if (typeof enabled === "boolean") {
      setAllow(enabled);
      return;
    }
    if (!flag) {
      setAllow(true);
      return;
    }
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams.get(`exp-${flag}`);
      if (qp === "on" || qp === "off") {
        const allow = qp === "on";
        setAllow(allow);
        try { localStorage.setItem(`exp:${flag}`, allow ? "on" : "off"); } catch {}
        return;
      }
      const ls = localStorage.getItem(`exp:${flag}`);
      if (ls === "on" || ls === "off") {
        setAllow(ls === "on");
        return;
      }
    } catch {
      // ignore
    }
    setAllow(true);
  }, [flag, enabled]);

  return allow ? <>{children}</> : <>{fallback}</>;
}

