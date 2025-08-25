import { ulid } from "ulid";

function addAt(list, index, item) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

export function addComponent(list, parentId, index, component) {
  if (!parentId) {
    return addAt(list, index ?? list.length, component);
  }
  return list.map((c) => {
    if (c.id === parentId && "children" in c) {
      const childList = c.children ?? [];
      const children = addAt(childList, index ?? childList.length, component);
      return { ...c, children };
    }
    if ("children" in c && Array.isArray(c.children)) {
      return {
        ...c,
        children: addComponent(c.children, parentId, index, component),
      };
    }
    return c;
  });
}

export function removeComponent(list, id) {
  return list
    .map((c) =>
      "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) }
        : c,
    )
    .filter((c) => c.id !== id);
}

function cloneWithNewIds(component) {
  const copy = { ...component, id: ulid() };
  const childList = component.children;
  if (Array.isArray(childList)) {
    copy.children = childList.map((child) => cloneWithNewIds(child));
  }
  return copy;
}

export function duplicateComponent(list, id) {
  let duplicated = false;
  const result = [];
  for (const c of list) {
    if (!duplicated && c.id === id) {
      const clone = cloneWithNewIds(c);
      result.push(c, clone);
      duplicated = true;
      continue;
    }
    if (!duplicated) {
      const childList = c.children;
      if (Array.isArray(childList)) {
        const children = duplicateComponent(childList, id);
        if (children !== childList) {
          result.push({ ...c, children });
          duplicated = true;
          continue;
        }
      }
    }
    result.push(c);
  }
  return duplicated ? result : list;
}

export function updateComponent(list, id, patch) {
  const numericFields = [
    "minItems",
    "maxItems",
    "columns",
    "desktopItems",
    "tabletItems",
    "mobileItems",
  ];
  const normalized = { ...patch };
  for (const key of numericFields) {
    const val = patch[key];
    if (typeof val === "string") {
      const num = Number(val);
      normalized[key] = Number.isNaN(num) ? undefined : num;
    }
  }
  return list.map((c) => {
    if (c.id === id) return { ...c, ...normalized };
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: updateComponent(c.children, id, normalized) };
    }
    return c;
  });
}

export function resizeComponent(list, id, patch) {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: resizeComponent(c.children, id, patch) };
    }
    return c;
  });
}

function extractComponent(list, parentId, index) {
  if (!parentId) {
    const item = list[index];
    const rest = [...list.slice(0, index), ...list.slice(index + 1)];
    return [item, rest];
  }
  let removed = null;
  const newList = list.map((c) => {
    if (removed) return c;
    if (c.id === parentId && "children" in c) {
      const childList = c.children ?? [];
      const item = childList[index];
      removed = item ?? null;
      const rest = [...childList.slice(0, index), ...childList.slice(index + 1)];
      return { ...c, children: rest };
    }
    if ("children" in c && Array.isArray(c.children)) {
      const [item, rest] = extractComponent(c.children, parentId, index);
      if (item) {
        removed = item;
        return { ...c, children: rest };
      }
    }
    return c;
  });
  return [removed, newList];
}

export function moveComponent(list, from, to) {
  const [item, without] = extractComponent(list, from.parentId, from.index);
  if (!item) return list;
  return addComponent(without, to.parentId, to.index, item);
}

