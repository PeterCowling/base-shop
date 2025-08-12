"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/shadcn";

interface AuditRecord {
  timestamp: string;
  score: number;
  issues: number;
}

export default function SeoAuditPanel({ shop }: { shop: string }) {
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/seo/audit/${shop}`);
        const data: AuditRecord[] = await res.json();
        setHistory(data);
      } catch {
        // ignore
      }
    };
    void load();
  }, [shop]);

  const runAudit = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/seo/audit/${shop}`, { method: "POST" });
      const record: AuditRecord = await res.json();
      setHistory((prev) => [...prev, record]);
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  const last = history[history.length - 1];

  return (
    <div className="mt-8 border-t pt-4">
      <h3 className="mb-2 text-lg font-medium">SEO Audit</h3>
      <Button onClick={runAudit} disabled={running} className="bg-primary text-white">
        {running ? "Running…" : "Run audit"}
      </Button>
      {running && <p className="mt-2 text-sm">Audit in progress…</p>}
      {last && (
        <div className="mt-4 text-sm">
          <p>Last run: {new Date(last.timestamp).toLocaleString()}</p>
          <p>Score: {Math.round(last.score * 100)}</p>
          <p>Issues found: {last.issues}</p>
        </div>
      )}
    </div>
  );
}
