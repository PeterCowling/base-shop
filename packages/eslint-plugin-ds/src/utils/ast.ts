// Use loose 'any' to remain compatible with NodeNext builds without strict ESTree typing
type Node = any;

// Lightweight ESTree helpers for static analysis of class names.

export function isStringLiteral(node: Node | null | undefined): node is any {
  return !!node && (node.type === "Literal" && typeof (node as any).value === "string");
}

export function isBooleanLiteral(node: Node | null | undefined): node is any {
  return !!node && node.type === "Literal" && typeof (node as any).value === "boolean";
}

export function getStringIfStatic(node: Node | null | undefined): { value?: string; confident: boolean } {
  if (!node) return { confident: false };
  if (isStringLiteral(node)) return { value: String((node as any).value), confident: true };

  // TemplateLiteral with no expressions
  if ((node as any).type === "TemplateLiteral" && (node as any).expressions && (node as any).expressions.length === 0) {
    return {
      value: (node as any).quasis.map((q: any) => q.value.cooked ?? q.value.raw).join(""),
      confident: true,
    };
  }

  // BinaryExpression string concatenation of statically known strings
  if ((node as any).type === "BinaryExpression" && (node as any).operator === "+") {
    const left = getStringIfStatic((node as any).left);
    const right = getStringIfStatic((node as any).right);
    if (left.confident && right.confident && left.value !== undefined && right.value !== undefined) {
      return { value: left.value + right.value, confident: true };
    }
    return { confident: false };
  }

  return { confident: false };
}

export function getBooleanIfStatic(node: Node | null | undefined): { value?: boolean; confident: boolean } {
  if (!node) return { confident: false };
  if (isBooleanLiteral(node)) return { value: Boolean((node as any).value), confident: true };
  if ((node as any).type === "UnaryExpression" && (node as any).operator === "!" && (node as any).argument) {
    const inner = getBooleanIfStatic((node as any).argument as any);
    return inner.confident ? { value: !inner.value, confident: true } : { confident: false };
  }
  return { confident: false };
}

export function isClassNameAttribute(node: any): boolean {
  return (
    node && node.type === "JSXAttribute" && node.name && (node.name.name === "className" || node.name.name === "class")
  );
}
