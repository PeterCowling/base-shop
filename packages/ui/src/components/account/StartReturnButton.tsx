"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "@acme/i18n";
import enMessages from "@acme/i18n/en.json";

interface Props {
  sessionId: string;
}

const FALLBACK_MESSAGES = enMessages as Record<string, string>;

const formatWithParams = (
  template: string,
  params?: Record<string, string | number>
) => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
};

export default function StartReturnButton({ sessionId }: Props) {
  const t = useTranslations();
  const translate = (key: string, params?: Record<string, string | number>) => {
    const resolved = t(key, params) as string;
    if (resolved !== key) {
      return resolved;
    }

    const fallback = FALLBACK_MESSAGES[key];
    if (!fallback) {
      return key;
    }

    return formatWithParams(fallback, params);
  };
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dropOffProvider, setDropOffProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/return?tracking=${tracking}`);
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
        }
      } catch {
        // ignore errors
      }
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, [tracking]);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.tracking) {
        setTracking(data.tracking.number);
        setLabelUrl(data.tracking.labelUrl ?? null);
      }
      if (data.dropOffProvider) {
        setDropOffProvider(data.dropOffProvider);
      }
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-primary px-3 py-1 min-h-11 min-w-11"
        data-token="--color-primary" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — label below is translated
      >
        <span
          className="text-primary-foreground"
          data-token="--color-primary-fg" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — child content uses t()
        >
          {loading
            ? translate("actions.processing")
            : translate("returns.start")}
        </span>
      </button>
      {labelUrl && (
        <p className="mt-1 text-sm">
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-block min-h-11 min-w-11"
          >
            {translate("returns.downloadLabel")}
          </a>
        </p>
      )}
      {dropOffProvider && (
        <p className="mt-1 text-sm">
          {translate("returns.dropOff", { provider: dropOffProvider })}
        </p>
      )}
      {tracking && (
        <p className="mt-1 text-sm">{translate("returns.tracking", { number: tracking })}</p>
      )}
      {status && (
        <p className="mt-1 text-sm">{translate("returns.status", { status })}</p>
      )}
    </div>
  );
}
