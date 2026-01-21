import type { PageComponent } from "@acme/types";

export function walkTree(
  list: PageComponent[],
  visit: (node: PageComponent, parent: PageComponent | undefined) => void,
  parent?: PageComponent,
): void {
  for (const node of list) {
    visit(node, parent);
    const children = (node as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      walkTree(children, visit, node);
    }
  }
}

