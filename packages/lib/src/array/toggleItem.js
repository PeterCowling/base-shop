export function toggleItem(list, value) {
    return list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
}
