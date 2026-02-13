"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { readJsonSafely } from "@/lib/json";

const RunStatusDataSchema = z.object({
  taskId: z.string(),
  status: z.enum(["in-progress", "complete", "failed"]),
  action: z.string(),
  target: z.string(),
  started: z.string(),
  completed: z.string().optional(),
  lastMessage: z.string().optional(),
  error: z.string().optional(),
  output: z.string().optional(),
  commitHash: z.string().optional(),
});

type RunStatusData = z.infer<typeof RunStatusDataSchema>;

interface RunStatusProps {
  entityId: string;
  taskId?: string;
}

/* eslint-disable ds/no-hardcoded-copy -- BOS-33: Phase 0 agent status UI */
export function RunStatus({ entityId: _entityId, taskId }: RunStatusProps) {
  const [runStatus, setRunStatus] = useState<RunStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent-runs/${taskId}/status`);

        if (response.status === 404) {
          setError("Run log not found");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch run status");
        }

        const json = await readJsonSafely(response);
        const parsed = RunStatusDataSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error("Invalid run status response");
        }

        const data = parsed.data;
        setRunStatus(data);
        setError(null);

        // Stop polling if run is complete or failed
        if (data.status === "complete" || data.status === "failed") {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    void fetchStatus();

    // Poll every 5 seconds when run is active
    intervalId = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taskId]);

  if (!taskId) {
    return null;
  }

  if (loading && !runStatus) {
    return (
      <div className="bg-info-soft border border-info-soft rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
          <span className="text-sm text-info-fg">Checking agent status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-soft border border-danger-soft rounded-lg p-4">
        <p className="text-sm text-danger-fg">Error: {error}</p>
      </div>
    );
  }

  if (!runStatus) {
    return null;
  }

  const statusColors = {
    "in-progress": "bg-info-soft border-info-soft text-info-fg",
    complete: "bg-success-soft border-success-soft text-success-fg",
    failed: "bg-danger-soft border-danger-soft text-danger-fg",
  };

  const statusLabels = {
    "in-progress": "Agent Working",
    complete: "Agent Complete",
    failed: "Agent Failed",
  };

  return (
    <div
      className={`border rounded-lg p-4 ${statusColors[runStatus.status]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {runStatus.status === "in-progress" && (
            <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
          )}
          <span className="text-sm font-semibold">
            {statusLabels[runStatus.status]}
          </span>
        </div>
        <span className="text-xs font-mono">{runStatus.taskId}</span>
      </div>

      <div className="text-sm mb-2">
        <span className="font-medium">Action:</span> {runStatus.action} for{" "}
        {runStatus.target}
      </div>

      {runStatus.lastMessage && (
        <div className="text-sm mb-2">
          <span className="font-medium">Status:</span> {runStatus.lastMessage}
        </div>
      )}

      {runStatus.error && (
        <div className="text-sm text-danger-fg mt-2 p-2 bg-danger-soft rounded">
          <span className="font-medium">Error:</span> {runStatus.error}
        </div>
      )}

      {runStatus.commitHash && (
        <div className="text-xs text-muted mt-2">
          <span className="font-medium">Commit:</span>{" "}
          <code className="font-mono">{runStatus.commitHash.slice(0, 8)}</code>
        </div>
      )}

      <div className="text-xs text-muted mt-2">
        Started: {new Date(runStatus.started).toLocaleString()}
        {runStatus.completed && (
          <> • Completed: {new Date(runStatus.completed).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}
