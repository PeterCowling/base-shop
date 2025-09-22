import type { PageComponent } from "@acme/types";
import { ulid as generateId } from "ulid";

export function cloneWithNewIds(component: PageComponent): PageComponent {
  const copy: PageComponent = { ...component, id: generateId() };
  const childList = (component as { children?: PageComponent[] }).children;
  if (Array.isArray(childList)) {
    (copy as { children?: PageComponent[] }).children = childList.map((child) =>
      cloneWithNewIds(child),
    );
  }
  return copy;
}

