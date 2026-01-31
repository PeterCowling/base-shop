"use client";

import { useEffect, useState } from "react";

import { isRecord, safeReadJson } from "@/lib/json";

interface RunStatusData {
  taskId: string;
  status: "in-progress" | "complete" | "failed";
  action: string;
  target: string;
  started: string;
  completed?: string;
  lastMessage?: string;
  error?: string;
  output?: string;
  commitHash?: string;
}

interface RunStatusProps {
  entityId: string;
  taskId?: string;
}

function isRunStatus(value: unknown): value is RunStatusData {
  if (!isRecord(value)) {
    return false;
  }

  const status = value.status;
  const isValidStatus =
    status === "in-progress" || status === "complete" || status === "failed";

  return (
    typeof value.taskId === "string" &&
    isValidStatus &&
    typeof value.action === "string" &&
    typeof value.target === "string" &&
    typeof value.started === "string"
  );
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

        const data = await safeReadJson(response);
        if (!isRunStatus(data)) {
          throw new Error("Invalid run status response");
        }

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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm text-blue-900">Checking agent status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-900">Error: {error}</p>
      </div>
    );
  }

  if (!runStatus) {
    return null;
  }

  const statusColors = {
    "in-progress": "bg-blue-50 border-blue-200 text-blue-900",
    complete: "bg-green-50 border-green-200 text-green-900",
    failed: "bg-red-50 border-red-200 text-red-900",
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
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
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
        <div className="text-sm text-red-800 mt-2 p-2 bg-red-100 rounded">
          <span className="font-medium">Error:</span> {runStatus.error}
        </div>
      )}

      {runStatus.commitHash && (
        <div className="text-xs text-gray-600 mt-2">
          <span className="font-medium">Commit:</span>{" "}
          <code className="font-mono">{runStatus.commitHash.slice(0, 8)}</code>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Started: {new Date(runStatus.started).toLocaleString()}
        {runStatus.completed && (
          <> • Completed: {new Date(runStatus.completed).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}
