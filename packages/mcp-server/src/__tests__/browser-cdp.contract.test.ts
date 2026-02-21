/** @jest-environment node */

import { readFileSync } from "fs";

import {
  type AxNodeFixture,
  extractInteractiveCandidatesFromAxTree,
  resolveBackendDomNodeId,
} from "../tools/browser/cdp";
import { buildSelectorForNode } from "../tools/browser/selectors";

type AxFixture = {
  axTree: { nodes: ReadonlyArray<AxNodeFixture> };
};

type DomFixture = {
  document: { root: unknown };
  described: ReadonlyArray<unknown>;
};

function readJsonFixture<T>(relativePath: string): T {
  const contents = readFileSync(relativePath, "utf8");
  return JSON.parse(contents) as T;
}

describe("browser CDP fixtures contract (TASK-03)", () => {
  const axFixture = readJsonFixture<AxFixture>(
    "packages/mcp-server/src/__tests__/fixtures/browser/cdp-ax-tree.json"
  );
  const domFixture = readJsonFixture<DomFixture>(
    "packages/mcp-server/src/__tests__/fixtures/browser/cdp-dom-describe.json"
  );

  test('TC-01: AX fixture contains a button "Place order" -> extracted affordance includes role=button, name="Place order"', () => {
    const candidates = extractInteractiveCandidatesFromAxTree({ nodes: axFixture.axTree.nodes });
    const placeOrder = candidates.find((c) => c.role === "button" && c.name === "Place order");

    expect(placeOrder).toBeTruthy();
    expect(placeOrder?.backendDOMNodeId).toBe(11);
  });

  test("TC-02: backendDOMNodeId resolves to DOM node with attributes", () => {
    const resolved = resolveBackendDomNodeId({
      backendDOMNodeId: 11,
      described: domFixture.described as never,
    });

    expect(resolved).toBeTruthy();
    expect(resolved?.localName).toBe("button");
    expect(resolved?.attributes.id).toBe("place-order");
  });

  test("TC-03: selector builder yields #id when present", () => {
    const resolved = resolveBackendDomNodeId({
      backendDOMNodeId: 11,
      described: domFixture.described as never,
    });
    expect(resolved).toBeTruthy();
    if (!resolved) {
      return;
    }

    const selector = buildSelectorForNode({
      document: { root: domFixture.document.root as never },
      nodeId: resolved.nodeId,
      localName: resolved.localName,
      attributes: resolved.attributes,
    });

    expect(selector.selector).toBe("#place-order");
    expect(selector.bestEffort).toBe(false);
    expect(selector.strategy).toBe("id");
  });

  test("TC-04: when no id, selector builder falls back to stable attribute selector when available", () => {
    const resolved = resolveBackendDomNodeId({
      backendDOMNodeId: 12,
      described: domFixture.described as never,
    });
    expect(resolved).toBeTruthy();
    if (!resolved) {
      return;
    }

    const selector = buildSelectorForNode({
      document: { root: domFixture.document.root as never },
      nodeId: resolved.nodeId,
      localName: resolved.localName,
      attributes: resolved.attributes,
    });

    expect(selector.selector).toBe('[data-testid="confirm-button"]');
    expect(selector.bestEffort).toBe(false);
    expect(selector.strategy).toBe("data-testid");
  });

  test("TC-05: when no stable selector exists, selector builder falls back to nth-child path and marks selector as best-effort", () => {
    const resolved = resolveBackendDomNodeId({
      backendDOMNodeId: 13,
      described: domFixture.described as never,
    });
    expect(resolved).toBeTruthy();
    if (!resolved) {
      return;
    }

    const selector = buildSelectorForNode({
      document: { root: domFixture.document.root as never },
      nodeId: resolved.nodeId,
      localName: resolved.localName,
      attributes: resolved.attributes,
    });

    expect(selector.strategy).toBe("nth-child");
    expect(selector.bestEffort).toBe(true);
    expect(selector.selector).toContain("button:nth-child(");
  });
});
