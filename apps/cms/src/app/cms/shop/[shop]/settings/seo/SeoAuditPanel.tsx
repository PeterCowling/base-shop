"use client";
import { useEffect, useState } from "react";

import { Skeleton, Toast, Tooltip } from "@/components/atoms";
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import { formatTimestamp } from "@acme/date-utils";

interface AuditRecord {
  timestamp: string;
  score: number;
  issues: number;
  recommendations?: string[];
}

export default function SeoAuditPanel({ shop }: { shop: string }) {
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" },
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/seo/audit/${shop}`);
        const data: AuditRecord[] = await res.json();
        if (active) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setHistory([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [shop]);

  const last = history[history.length - 1];

  const runAudit = async () => {
    setRunning(true);
    setToast({ open: true, message: "Audit started" });
    try {
      const res = await fetch(`/api/seo/audit/${shop}`, { method: "POST" });
      const record: AuditRecord = await res.json();
      setHistory((prev) => [...prev, record]);
      setToast({ open: true, message: "Audit completed" });
    } catch {
      setToast({ open: true, message: "Audit failed" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6 text-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">SEO Audit</h3>
              <p className="text-muted-foreground text-sm">
                Review the latest crawl score, issues found, and actionable recommendations.
              </p>
            </div>
            <Button className="shrink-0" onClick={runAudit} disabled={running}>
              {running ? "Running audit…" : "Run audit"}
            </Button>
          </div>

          {running && (
            <p className="text-xs text-primary">Audit in progress…</p>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">Last run</p>
                <p className="text-base font-semibold">
                  {last ? formatTimestamp(last.timestamp) : "Never"}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Score
                  <Tooltip text="Scores are normalized to 0–100">?</Tooltip>
                </p>
                <p className="text-base font-semibold">
                  {last ? Math.round(last.score * 100) : "–"}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">Issues found</p>
                <p className="text-base font-semibold">{last ? last.issues : "–"}</p>
              </div>
            </div>
          )}

          {!loading && last?.recommendations?.length ? (
            <div>
              <h4 className="text-sm font-semibold">Latest recommendations</h4>
              <ul className="mt-2 list-disc pl-5">
                {last.recommendations.map((rec) => (
                  <li key={rec}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!loading && history.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Audit history</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.timestamp}>
                      <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                      <TableCell>{Math.round(item.score * 100)}</TableCell>
                      <TableCell>{item.issues}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}
