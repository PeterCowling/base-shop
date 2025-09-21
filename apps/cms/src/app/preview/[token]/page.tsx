"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/atoms/shadcn";

interface VersionResponse {
  shop: string;
  pageId: string;
  versionId: string;
  label: string;
  timestamp: string;
  components: unknown[];
  editor?: Record<string, unknown>;
}

export default function PreviewViewer({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [data, setData] = useState<VersionResponse | null>(null);

  useEffect(() => {
    void (async () => {
      const { token } = await params;
      setToken(token);
    })();
  }, [params]);

  const apiUrl = useMemo(() => (token ? `/cms/api/page-versions/preview/${token}${pw ? `?pw=${encodeURIComponent(pw)}` : ""}` : ""), [token, pw]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (res.status === 401) {
        setError("Password required or incorrect");
        return;
      }
      if (!res.ok) throw new Error(`Failed to load preview: ${res.status}`);
      const json = (await res.json()) as VersionResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt load without password initially
    if (token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">Version Preview</h1>
      <div className="rounded border border-border/10 p-3 space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">Password (if required)</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Enter password" />
          </div>
          <Button onClick={load} disabled={loading || !token}>{loading ? "Loading…" : "Load Preview"}</Button>
        </div>
        {error && <p className="text-sm text-danger-foreground">{error}</p>}
      </div>
      {data && (
        <div className="space-y-3">
          <div className="rounded border border-border/10 p-3">
            <div className="text-sm text-muted-foreground">Shop: <span className="font-mono">{data.shop}</span></div>
            <div className="text-sm text-muted-foreground">Page: <span className="font-mono">{data.pageId}</span></div>
            <div className="text-sm text-muted-foreground">Version: <span className="font-mono">{data.versionId}</span></div>
            <div className="text-sm">Label: <span className="font-medium">{data.label}</span></div>
            <div className="text-sm">Timestamp: {new Date(data.timestamp).toLocaleString()}</div>
            <div className="mt-2 text-sm">
              Components: <span className="font-mono">{Array.isArray(data.components) ? data.components.length : 0}</span>
            </div>
          </div>
          <div className="rounded border border-border/10 p-3">
            <div className="mb-2 text-sm font-medium">JSON</div>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words text-xs bg-muted/40 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
            <div className="mt-2 text-xs">
              <a className="text-primary underline" href={apiUrl} target="_blank" rel="noreferrer">Open raw JSON</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
