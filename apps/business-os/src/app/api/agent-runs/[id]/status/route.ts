import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import matter from "gray-matter";

import { getRepoRoot } from "@/lib/get-repo-root";

// Phase 0: Node runtime required for filesystem operations
export const runtime = "nodejs";

interface RunStatusResponse {
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

/**
 * GET /api/agent-runs/[id]/status
 * Read run log file and return status
 *
 * MVP-E4: Agent run status UI
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-33 invalid task id (non-UI) [ttl=2026-03-31]
      { error: "Invalid task id" },
      { status: 400 }
    );
  }

  try {
    const repoRoot = getRepoRoot();
    const runLogPath = path.join(
      repoRoot,
      "docs/business-os/agent-runs",
      id,
      "run.log.md"
    );

    // Check if run log exists
    try {
      await fs.access(runLogPath);
    } catch {
      return NextResponse.json(
        { error: `Run log for task ${id} not found` },
        { status: 404 }
      );
    }

    // Read and parse run log
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-33 validated repo-internal path [ttl=2026-03-31]
    const logContent = await fs.readFile(runLogPath, "utf-8");
    const parsed = matter(logContent);

    // Extract status from frontmatter
    const status = parsed.data.Status as RunStatusResponse["status"];
    const action = parsed.data.Action as string;
    const target = parsed.data.Target as string;
    const started = parsed.data.Started as string;
    const completed = parsed.data.Completed as string | undefined;
    const error = parsed.data.Error as string | undefined;
    const output = parsed.data.Output as string | undefined;
    const commitHash = parsed.data.CommitHash as string | undefined;

    // Extract last message from log content
    const logLines = parsed.content.trim().split("\n");
    const lastMessage = logLines
      .reverse()
      .find((line) => line.trim().length > 0 && !line.startsWith("#"));

    const response: RunStatusResponse = {
      taskId: id,
      status,
      action,
      target,
      started,
      completed,
      lastMessage,
      error,
      output,
      commitHash,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-33 MVP-E4 API error message [ttl=2026-03-31]
      { error: "Failed to read run status", details: String(error) },
      { status: 500 }
    );
  }
}
