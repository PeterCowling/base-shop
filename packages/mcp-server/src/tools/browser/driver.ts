import type { BicPageIdentity } from "./bic.js";
import type { AxNodeFixture, DomNodeDescriptionFixture } from "./cdp.js";

export type BrowserObservationMode = "a11y";

export type BrowserObserveScope = "viewport" | "document" | "modal";

export type BrowserObserveSnapshotRequest = {
  mode: BrowserObservationMode;
  scope: BrowserObserveScope;
  includeHidden: boolean;
  includeDisabled: boolean;
};

export type BrowserObserveSnapshot = {
  page: BicPageIdentity;
  axNodes: ReadonlyArray<AxNodeFixture>;
  describedNodes: ReadonlyArray<DomNodeDescriptionFixture>;
};

export type BrowserActTarget =
  | { kind: "element"; selector: string }
  | { kind: "page" };

export type BrowserActAction =
  | { type: "click" }
  | { type: "fill"; value: string }
  | { type: "navigate"; url: string }
  | { type: "evaluate"; expression: string };

export type BrowserActRequest = {
  target: BrowserActTarget;
  action: BrowserActAction;
};

export type BrowserDownload = {
  filename: string;
  path: string;
  size: number;
  mimeType: string | null;
  timestamp: string;
};

export type BrowserDriver = {
  snapshot: (input: BrowserObserveSnapshotRequest) => Promise<BrowserObserveSnapshot>;
  act: (input: BrowserActRequest) => Promise<void>;
  getDownloads: () => Promise<ReadonlyArray<BrowserDownload>>;
  waitForDownload: (input: { timeoutMs: number }) => Promise<BrowserDownload | null>;
  close: () => Promise<void>;
};

export type MockBrowserDriverState = {
  page: BicPageIdentity;
  axNodes: ReadonlyArray<AxNodeFixture>;
  describedNodes: ReadonlyArray<DomNodeDescriptionFixture>;
};

export type RecordedBrowserAction = BrowserActRequest;

export type MockBrowserDriver = BrowserDriver & {
  getRecordedActions: () => ReadonlyArray<RecordedBrowserAction>;
};

export function createMockBrowserDriver(input: {
  states: ReadonlyArray<MockBrowserDriverState>;
}): MockBrowserDriver {
  const states = [...input.states];
  if (states.length === 0) {
    throw new Error("MockBrowserDriver requires at least one state");
  }

  let idx = 0;
  const recorded: RecordedBrowserAction[] = [];

  async function snapshot(_req: BrowserObserveSnapshotRequest): Promise<BrowserObserveSnapshot> {
    const state = states[Math.min(idx, states.length - 1)];
    return {
      page: state.page,
      axNodes: state.axNodes,
      describedNodes: state.describedNodes,
    };
  }

  async function act(req: BrowserActRequest): Promise<void> {
    recorded.push(req);

    if (req.target.kind === "page" && req.action.type === "navigate") {
      // v0.1: deterministic state transition. If a next state exists, advance.
      // Otherwise, mutate the current state's url/finalUrl.
      if (idx + 1 < states.length) {
        idx += 1;
        return;
      }

      const current = states[Math.min(idx, states.length - 1)];
      states[Math.min(idx, states.length - 1)] = {
        ...current,
        page: {
          ...current.page,
          url: req.action.url,
          finalUrl: req.action.url,
        },
      };
    }
  }

  async function close(): Promise<void> {
    // no-op
  }

  async function getDownloads(): Promise<ReadonlyArray<BrowserDownload>> {
    return [];
  }

  async function waitForDownload(_input: { timeoutMs: number }): Promise<BrowserDownload | null> {
    return null;
  }

  return {
    snapshot,
    act,
    getDownloads,
    waitForDownload,
    close,
    getRecordedActions: () => recorded,
  };
}
