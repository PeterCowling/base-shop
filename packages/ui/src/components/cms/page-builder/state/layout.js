import { ulid } from "ulid";
import { commit } from "./history";
function addAt(list, index, item) {
    return [...list.slice(0, index), item, ...list.slice(index)];
}
function addComponent(list, parentId, index, component) {
    if (!parentId) {
        return addAt(list, index ?? list.length, component);
    }
    return list.map((c) => {
        if (c.id === parentId && "children" in c) {
            const childList = c.children ?? [];
            const children = addAt(childList, index ?? childList.length, component);
            return { ...c, children };
        }
        if ("children" in c &&
            Array.isArray(c.children)) {
            return {
                ...c,
                children: addComponent(c.children, parentId, index, component),
            };
        }
        return c;
    });
}
function removeComponent(list, id) {
    return list
        .map((c) => "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) }
        : c)
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
function duplicateComponent(list, id) {
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
function updateComponent(list, id, patch) {
    const numericFields = [
        "minItems",
        "maxItems",
        "columns",
        "desktopItems",
        "tabletItems",
        "mobileItems",
    ];
    const normalized = {
        ...patch,
    };
    for (const key of numericFields) {
        const val = patch[key];
        if (typeof val === "string") {
            const num = Number(val);
            normalized[key] = Number.isNaN(num) ? undefined : num;
        }
    }
    return list.map((c) => {
        if (c.id === id)
            return { ...c, ...normalized };
        if ("children" in c && Array.isArray(c.children)) {
            return { ...c, children: updateComponent(c.children, id, normalized) };
        }
        return c;
    });
}
function resizeComponent(list, id, patch) {
    return list.map((c) => {
        if (c.id === id)
            return { ...c, ...patch };
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
        if (removed)
            return c;
        if (c.id === parentId && "children" in c) {
            const childList = (c.children ?? []);
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
function moveComponent(list, from, to) {
    const [item, without] = extractComponent(list, from.parentId, from.index);
    if (!item)
        return list;
    return addComponent(without, to.parentId, to.index, item);
}
export function add(state, action) {
    return commit(state, addComponent(state.present, action.parentId, action.index, action.component));
}
export function move(state, action) {
    return commit(state, moveComponent(state.present, action.from, action.to));
}
export function remove(state, action) {
    return commit(state, removeComponent(state.present, action.id));
}
export function duplicate(state, action) {
    return commit(state, duplicateComponent(state.present, action.id));
}
export function update(state, action) {
    return commit(state, updateComponent(state.present, action.id, action.patch));
}
export function resize(state, action) {
    const normalize = (v) => {
        if (v === undefined)
            return undefined;
        const trimmed = v.trim();
        if (trimmed === "")
            return undefined;
        return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
    };
    const patch = {};
    const width = normalize(action.width);
    const height = normalize(action.height);
    const left = normalize(action.left);
    const top = normalize(action.top);
    const widthDesktop = normalize(action.widthDesktop);
    const widthTablet = normalize(action.widthTablet);
    const widthMobile = normalize(action.widthMobile);
    const heightDesktop = normalize(action.heightDesktop);
    const heightTablet = normalize(action.heightTablet);
    const heightMobile = normalize(action.heightMobile);
    const marginDesktop = normalize(action.marginDesktop);
    const marginTablet = normalize(action.marginTablet);
    const marginMobile = normalize(action.marginMobile);
    const paddingDesktop = normalize(action.paddingDesktop);
    const paddingTablet = normalize(action.paddingTablet);
    const paddingMobile = normalize(action.paddingMobile);
    if (width !== undefined)
        patch.width = width;
    if (height !== undefined)
        patch.height = height;
    if (left !== undefined)
        patch.left = left;
    if (top !== undefined)
        patch.top = top;
    if (widthDesktop !== undefined)
        patch.widthDesktop = widthDesktop;
    if (widthTablet !== undefined)
        patch.widthTablet = widthTablet;
    if (widthMobile !== undefined)
        patch.widthMobile = widthMobile;
    if (heightDesktop !== undefined)
        patch.heightDesktop = heightDesktop;
    if (heightTablet !== undefined)
        patch.heightTablet = heightTablet;
    if (heightMobile !== undefined)
        patch.heightMobile = heightMobile;
    if (marginDesktop !== undefined)
        patch.marginDesktop = marginDesktop;
    if (marginTablet !== undefined)
        patch.marginTablet = marginTablet;
    if (marginMobile !== undefined)
        patch.marginMobile = marginMobile;
    if (paddingDesktop !== undefined)
        patch.paddingDesktop = paddingDesktop;
    if (paddingTablet !== undefined)
        patch.paddingTablet = paddingTablet;
    if (paddingMobile !== undefined)
        patch.paddingMobile = paddingMobile;
    return commit(state, resizeComponent(state.present, action.id, patch));
}
export function set(state, action) {
    return commit(state, action.components);
}
export function setGridCols(state, action) {
    return { ...state, gridCols: action.gridCols };
}
