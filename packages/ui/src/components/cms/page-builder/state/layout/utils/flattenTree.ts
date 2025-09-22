import type { PageComponent } from "@acme/types";
import { walkTree } from "./walkTree";

export function flattenTree(list: PageComponent[]): PageComponent[] {
  const result: PageComponent[] = [];
  walkTree(list, (n) => {
    result.push(n);
  });
  return result;
}

