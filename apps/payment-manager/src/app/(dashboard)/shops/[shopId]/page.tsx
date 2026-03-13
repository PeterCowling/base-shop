/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size, ds/container-widths-only-at, ds/enforce-focus-ring-token -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /shops/:shopId — Payment Manager shop config page
 *
 * Shows and edits:
 *   - Active payment provider (dropdown)
 *   - Provider credentials (masked display + save form)
 *   - Test-connection button per provider
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface ShopConfig {
  shopId: string;
  activeProvider: string;
  updatedAt: string;
}

interface CredentialEntry {
  key: string;
  value: string; // always "****" from API (masked)
}

const PROVIDERS = ["stripe", "axerve", "disabled"] as const;
type Provider = typeof PROVIDERS[number];

const STRIPE_CREDENTIAL_KEYS = ["apiKey"];
const AXERVE_CREDENTIAL_KEYS = ["shopLogin", "apiKey"];

function providerCredentialKeys(provider: Provider): string[] {
  if (provider === "stripe") return STRIPE_CREDENTIAL_KEYS;
  if (provider === "axerve") return AXERVE_CREDENTIAL_KEYS;
  return [];
}

function ProviderBadge({ provider }: { provider: string }) {
  const colorMap: Record<string, string> = {
    stripe: "bg-blue-100 text-blue-800",
    axerve: "bg-purple-100 text-purple-800",
    disabled: "bg-gray-100 text-gray-600",
  };
  const cls = colorMap[provider] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {provider}
    </span>
  );
}

function CredentialForm({
  shopId,
  provider,
  onSaved,
}: {
  shopId: string;
  provider: Provider;
  onSaved: () => void;
}) {
  const keys = providerCredentialKeys(provider);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(keys.map((k) => [k, ""])),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (keys.length === 0) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const credentials: Record<string, string> = {};
      for (const key of keys) {
        if (values[key]?.trim()) credentials[key] = values[key].trim();
      }
      if (Object.keys(credentials).length === 0) {
        setSaveError("Enter at least one credential value to save");
        return;
      }
      const res = await fetch(`/api/shops/${shopId}/credentials/${provider}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSaveError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setSaveSuccess(true);
      setValues(Object.fromEntries(keys.map((k) => [k, ""])));
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/credentials/${provider}/test`, {
        method: "POST",
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      setTestResult(body);
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mt-4 rounded border border-gate-border p-4">
      <h3 className="mb-3 text-sm font-medium text-gate-muted">
        {provider.charAt(0).toUpperCase() + provider.slice(1)} credentials
      </h3>
      <form onSubmit={(e) => { void handleSave(e); }} className="space-y-3">
        {keys.map((key) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-gate-muted" htmlFor={`cred-${provider}-${key}`}>
              {key}
            </label>
            <input
              id={`cred-${provider}-${key}`}
              type="password"
              autoComplete="off"
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              placeholder="Enter new value (leave blank to keep existing)"
              className="w-full rounded border border-gate-border bg-gate-input px-3 py-2 text-sm text-gate-ink focus:outline-none focus:ring-1 focus:ring-gate-accent"
            />
          </div>
        ))}
        {saveError && (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
            Credentials saved
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gate-accent px-3 py-1.5 text-xs text-gate-on-accent hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save credentials"}
          </button>
          <button
            type="button"
            onClick={() => { void handleTest(); }}
            disabled={testing}
            className="rounded border border-gate-border px-3 py-1.5 text-xs hover:bg-gate-surface disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>
        {testResult !== null && (
          <div className={`rounded border px-3 py-2 text-xs ${testResult.ok ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"}`}>
            {testResult.ok ? "Connection OK" : `Connection failed: ${testResult.error ?? "Unknown error"}`}
          </div>
        )}
      </form>
    </div>
  );
}

export default function ShopConfigPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider>("axerve");
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, CredentialEntry[]>>({});

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/config`);
      if (res.status === 404) { setError("Shop not found"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ShopConfig;
      setConfig(data);
      setSelectedProvider(data.activeProvider as Provider);

      // Load masked credential status for each provider
      const credResults: Record<string, CredentialEntry[]> = {};
      for (const prov of ["stripe", "axerve"] as Provider[]) {
        const cr = await fetch(`/api/shops/${shopId}/credentials/${prov}`);
        if (cr.ok) {
          const cdata = (await cr.json()) as { credentials: Record<string, string> };
          credResults[prov] = Object.entries(cdata.credentials).map(([key, value]) => ({ key, value }));
        }
      }
      setCredentials(credResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop config");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleSwitchProvider() {
    if (!config || selectedProvider === config.activeProvider) return;
    setSwitching(true);
    setSwitchMsg(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProvider: selectedProvider }),
      });
      const body = (await res.json()) as ShopConfig & { ok?: boolean; error?: string };
      if (!res.ok) {
        setSwitchMsg(`Error: ${body.error ?? `HTTP ${res.status}`}`);
        return;
      }
      const now = new Date(body.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setSwitchMsg(`Switched ${shopId} from ${config.activeProvider} → ${selectedProvider} at ${now}`);
      setConfig(body);
    } catch (err) {
      setSwitchMsg(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setSwitching(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-gate-bg text-gate-ink">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gate-surface" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !config) {
    return (
      <main className="min-h-dvh bg-gate-bg text-gate-ink">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Shop not found"}
          </div>
          <Link href="/shops" className="mt-4 inline-block text-sm text-gate-accent hover:underline">
            ← Back to shops
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/shops" className="mb-4 inline-block text-sm text-gate-accent hover:underline">
          ← Back to shops
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-xl font-semibold font-mono">{shopId}</h1>
          <ProviderBadge provider={config.activeProvider} />
        </div>

        {/* Provider selection */}
        <section className="mb-8 rounded border border-gate-border p-4">
          <h2 className="mb-3 text-sm font-medium text-gate-muted">Active payment provider</h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as Provider)}
              className="rounded border border-gate-border bg-gate-input px-3 py-2 text-sm text-gate-ink focus:outline-none focus:ring-1 focus:ring-gate-accent"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={() => { void handleSwitchProvider(); }}
              disabled={switching || selectedProvider === config.activeProvider}
              className="rounded bg-gate-accent px-4 py-2 text-sm text-gate-on-accent hover:opacity-90 disabled:opacity-50"
            >
              {switching ? "Switching…" : "Save provider"}
            </button>
          </div>
          {switchMsg && (
            <p className={`mt-2 text-xs ${switchMsg.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
              {switchMsg}
            </p>
          )}
        </section>

        {/* Credentials */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-gate-muted">Provider credentials</h2>
          <p className="mb-4 text-xs text-gate-muted">
            Stored credentials are shown masked. Enter a new value to update.
          </p>
          {(["stripe", "axerve"] as Provider[]).map((prov) => {
            const existing = credentials[prov] ?? [];
            return (
              <div key={prov} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium capitalize">{prov}</span>
                  {existing.length > 0 && (
                    <span className="text-xs text-gate-muted">
                      ({existing.map((e) => `${e.key}: ${e.value}`).join(", ")})
                    </span>
                  )}
                </div>
                <CredentialForm
                  shopId={shopId}
                  provider={prov}
                  onSaved={() => { void loadConfig(); }}
                />
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
