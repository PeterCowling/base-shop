export type AxNodeFixture = {
  role?: { value?: string };
  name?: { value?: string };
  backendDOMNodeId?: number;
  frameId?: string;
  ignored?: boolean;
};

export type AxInteractiveCandidate = {
  role: string;
  name: string;
  backendDOMNodeId: number | null;
  frameId?: string;
  targetable: boolean;
};

const INTERACTIVE_ROLES = new Set([
  "button",
  "textbox",
  "link",
  "checkbox",
  "radio",
  "combobox",
  "listbox",
  "option",
  "menuitem",
  "switch",
  "slider",
  "spinbutton",
  "tab",
  "searchbox",
]);

export function extractInteractiveCandidatesFromAxTree(input: {
  nodes: ReadonlyArray<AxNodeFixture>;
}): ReadonlyArray<AxInteractiveCandidate> {
  const candidates: AxInteractiveCandidate[] = [];

  for (const node of input.nodes) {
    if (node.ignored) {
      continue;
    }

    const role = (node.role?.value ?? "").trim();
    if (!role || !INTERACTIVE_ROLES.has(role)) {
      continue;
    }

    const name = (node.name?.value ?? "").trim();
    const backendDOMNodeId = typeof node.backendDOMNodeId === "number" ? node.backendDOMNodeId : null;

    candidates.push({
      role,
      name,
      backendDOMNodeId,
      frameId: node.frameId,
      targetable: backendDOMNodeId !== null,
    });
  }

  return candidates;
}

export type DomNodeDescriptionFixture = {
  node: {
    nodeId: number;
    backendNodeId?: number;
    localName?: string;
    nodeName?: string;
    nodeType?: number;
    attributes?: ReadonlyArray<string>;
  };
};

export type ResolvedDomNode = {
  nodeId: number;
  backendNodeId: number;
  localName: string;
  attributes: Readonly<Record<string, string>>;
};

function attributesListToRecord(attributes: ReadonlyArray<string> | undefined): Record<string, string> {
  const record: Record<string, string> = {};
  if (!attributes) {
    return record;
  }

  for (let i = 0; i < attributes.length; i += 2) {
    const key = attributes[i];
    const value = attributes[i + 1];
    if (typeof key === "string" && typeof value === "string") {
      record[key] = value;
    }
  }

  return record;
}

export function resolveBackendDomNodeId(input: {
  backendDOMNodeId: number;
  described: ReadonlyArray<DomNodeDescriptionFixture>;
}): ResolvedDomNode | null {
  for (const entry of input.described) {
    const node = entry.node;
    if (!node || typeof node.nodeId !== "number") {
      continue;
    }

    const backendNodeId = node.backendNodeId;
    if (typeof backendNodeId !== "number") {
      continue;
    }

    if (backendNodeId !== input.backendDOMNodeId) {
      continue;
    }

    const localName = (node.localName ?? node.nodeName ?? "").trim().toLowerCase();
    return {
      nodeId: node.nodeId,
      backendNodeId,
      localName,
      attributes: attributesListToRecord(node.attributes),
    };
  }

  return null;
}

