import path from "node:path";

import { describe, expect, it, jest } from "@jest/globals";

import { runExportToPr } from "./export-to-pr";

type MockSnapshot = {
  exportId: string;
  timestamp: string;
  auditCursor: number;
  cards: Array<{
    id: string;
    path: string;
    content: string;
    agentPath: string;
    agentContent: string;
  }>;
  ideas: Array<{
    id: string;
    path: string;
    content: string;
  }>;
  stageDocs: Array<{
    cardId: string;
    stage: string;
    path: string;
    content: string;
  }>;
};

function createSnapshot(): MockSnapshot {
  return {
    exportId: "export-1",
    timestamp: "2026-02-02T14:00:00Z",
    auditCursor: 22,
    cards: [
      {
        id: "BRIK-ENG-0001",
        path: "docs/business-os/cards/BRIK-ENG-0001.user.md",
        content: "---\nType: Card\n---\n",
        agentPath: "docs/business-os/cards/BRIK-ENG-0001.agent.md",
        agentContent: "---\nType: Card\n---\n",
      },
    ],
    ideas: [
      {
        id: "BRIK-OPP-0001",
        path: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
        content: "---\nType: Idea\n---\n",
      },
    ],
    stageDocs: [
      {
        cardId: "BRIK-ENG-0001",
        stage: "fact-find",
        path: "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md",
        content: "---\nType: Stage\n---\n",
      },
    ],
  };
}

function createDeps(statusOutput: string, snapshot: MockSnapshot) {
  const execCalls: string[] = [];
  const exec = jest.fn((command: string) => {
    execCalls.push(command);
    if (command.startsWith("git status")) {
      return statusOutput;
    }
    if (command.startsWith("gh pr create")) {
      return "https://github.com/acme/base-shop/pull/123";
    }
    return "";
  });

  const fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => snapshot,
  }));

  const fs = {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    unlink: jest.fn().mockResolvedValue(undefined),
  };

  return {
    deps: {
      fetch: fetch as unknown as typeof globalThis.fetch,
      exec,
      fs,
      cwd: "/repo",
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      now: () => new Date("2026-02-02T14:00:00Z"),
    },
    execCalls,
    fs,
    fetch,
  };
}

describe("export-to-pr", () => {
  it("TC-01: writes files to expected paths", async () => {
    const snapshot = createSnapshot();
    const { deps, fs } = createDeps(
      " M docs/business-os/cards/BRIK-ENG-0001.user.md",
      snapshot
    );

    await runExportToPr(deps, {
      apiKey: "test-key",
      baseUrl: "https://business-os.acme.dev",
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join("/repo", snapshot.cards[0].path),
      snapshot.cards[0].content,
      "utf-8"
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join("/repo", snapshot.cards[0].agentPath),
      snapshot.cards[0].agentContent,
      "utf-8"
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join("/repo", snapshot.ideas[0].path),
      snapshot.ideas[0].content,
      "utf-8"
    );
  });

  it("TC-02: no changes -> no PR created", async () => {
    const snapshot = createSnapshot();
    const { deps, execCalls } = createDeps("", snapshot);

    const result = await runExportToPr(deps, {
      apiKey: "test-key",
      baseUrl: "https://business-os.acme.dev",
    });

    expect(result.changed).toBe(false);
    expect(execCalls.some((command) => command.startsWith("gh pr create"))).toBe(
      false
    );
  });

  it("TC-03: changes detected -> PR created with title", async () => {
    const snapshot = createSnapshot();
    const { deps, execCalls } = createDeps(
      " M docs/business-os/cards/BRIK-ENG-0001.user.md",
      snapshot
    );

    await runExportToPr(deps, {
      apiKey: "test-key",
      baseUrl: "https://business-os.acme.dev",
    });

    const createCall = execCalls.find((command) =>
      command.startsWith("gh pr create")
    );
    expect(createCall).toContain(
      "chore(bos): export D1 snapshot [changed: BRIK-ENG-0001]"
    );
  });

  it("TC-04: PR body includes Export-Run-ID", async () => {
    const snapshot = createSnapshot();
    const { deps, execCalls } = createDeps(
      " M docs/business-os/cards/BRIK-ENG-0001.user.md",
      snapshot
    );

    await runExportToPr(deps, {
      apiKey: "test-key",
      baseUrl: "https://business-os.acme.dev",
      runId: "run-123",
    });

    const createCall = execCalls.find((command) =>
      command.startsWith("gh pr create")
    );
    expect(createCall).toContain("Export-Run-ID: run-123");
  });

  it("TC-05: enables auto-merge", async () => {
    const snapshot = createSnapshot();
    const { deps, execCalls } = createDeps(
      " M docs/business-os/cards/BRIK-ENG-0001.user.md",
      snapshot
    );

    await runExportToPr(deps, {
      apiKey: "test-key",
      baseUrl: "https://business-os.acme.dev",
    });

    expect(
      execCalls.some((command) =>
        command.startsWith("gh pr merge --auto --squash")
      )
    ).toBe(true);
  });

  it("TC-06: API failure throws", async () => {
    const snapshot = createSnapshot();
    const { deps } = createDeps("", snapshot);

    deps.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    })) as unknown as typeof globalThis.fetch;

    await expect(
      runExportToPr(deps, {
        apiKey: "test-key",
        baseUrl: "https://business-os.acme.dev",
      })
    ).rejects.toThrow("Export request failed");
  });
});
