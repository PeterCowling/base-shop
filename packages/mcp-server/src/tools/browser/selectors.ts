export type DomNodeFixture = {
  nodeId: number;
  parentId?: number;
  nodeType?: number;
  nodeName?: string;
  localName?: string;
  children?: ReadonlyArray<DomNodeFixture>;
};

export type DomDocumentFixture = {
  root: DomNodeFixture;
};

export type BuiltSelector = {
  selector: string;
  bestEffort: boolean;
  strategy: "id" | "data-testid" | "nth-child";
};

function isSafeCssIdentifier(input: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(input);
}

function quoteAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

type NodeIndexEntry = {
  node: DomNodeFixture;
  parentId: number | null;
};

function indexDomTree(root: DomNodeFixture): Map<number, NodeIndexEntry> {
  const index = new Map<number, NodeIndexEntry>();
  const stack: Array<{ node: DomNodeFixture; parentId: number | null }> = [{ node: root, parentId: null }];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      break;
    }

    index.set(current.node.nodeId, { node: current.node, parentId: current.parentId });

    const children = current.node.children ?? [];
    for (let i = children.length - 1; i >= 0; i -= 1) {
      const child = children[i];
      if (child) {
        stack.push({ node: child, parentId: current.node.nodeId });
      }
    }
  }

  return index;
}

function elementChildren(parent: DomNodeFixture): ReadonlyArray<DomNodeFixture> {
  const children = parent.children ?? [];
  return children.filter((child) => (child.nodeType ?? 1) === 1);
}

function findNthChildIndex(input: { parent: DomNodeFixture; nodeId: number }): number | null {
  const kids = elementChildren(input.parent);
  for (let i = 0; i < kids.length; i += 1) {
    if (kids[i]?.nodeId === input.nodeId) {
      return i + 1;
    }
  }
  return null;
}

function nodeTagName(node: DomNodeFixture): string {
  const tag = (node.localName ?? node.nodeName ?? "").trim().toLowerCase();
  return tag || "div";
}

export function buildSelectorForNode(input: {
  document: DomDocumentFixture;
  nodeId: number;
  localName: string;
  attributes: Readonly<Record<string, string>>;
}): BuiltSelector {
  const id = (input.attributes.id ?? "").trim();
  if (id) {
    if (isSafeCssIdentifier(id)) {
      return { selector: `#${id}`, bestEffort: false, strategy: "id" };
    }
    return {
      selector: `[id="${quoteAttributeValue(id)}"]`,
      bestEffort: false,
      strategy: "id",
    };
  }

  const testId = (input.attributes["data-testid"] ?? "").trim();
  if (testId) {
    return {
      selector: `[data-testid="${quoteAttributeValue(testId)}"]`,
      bestEffort: false,
      strategy: "data-testid",
    };
  }

  const index = indexDomTree(input.document.root);
  const current = index.get(input.nodeId);
  if (!current) {
    return {
      selector: input.localName ? input.localName : "div",
      bestEffort: true,
      strategy: "nth-child",
    };
  }

  const segments: string[] = [];
  let nodeId: number | null = input.nodeId;

  while (nodeId !== null) {
    const entry = index.get(nodeId);
    if (!entry) {
      break;
    }

    const parentId = entry.parentId;
    const parent = parentId !== null ? index.get(parentId)?.node : null;
    const tagName = nodeTagName(entry.node);

    if (!parent) {
      segments.push(tagName);
      break;
    }

    const nth = findNthChildIndex({ parent, nodeId: entry.node.nodeId });
    if (!nth) {
      segments.push(tagName);
      break;
    }

    segments.push(`${tagName}:nth-child(${nth})`);
    nodeId = parentId;
  }

  segments.reverse();
  return {
    selector: segments.join(" > "),
    bestEffort: true,
    strategy: "nth-child",
  };
}

