export type JsonPath = string;

type Visitor = (ctx: { path: JsonPath; value: string }) => void;

function joinPath(prefix: string, segment: string): string {
  return prefix ? `${prefix}.${segment}` : segment;
}

function joinIndex(prefix: string, index: number): string {
  return `${prefix}[${index}]`;
}

export function walkJsonStrings(node: unknown, visitor: Visitor, prefix = ""): void {
  if (typeof node === "string") {
    visitor({ path: prefix || "root", value: node });
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => walkJsonStrings(item, visitor, joinIndex(prefix, index)));
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      walkJsonStrings(value, visitor, joinPath(prefix, key));
    }
  }
}

