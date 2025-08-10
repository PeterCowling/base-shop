export function toggleItem(array, value) {
    const index = array.indexOf(value);
    return index === -1
        ? [...array, value]
        : [...array.slice(0, index), ...array.slice(index + 1)];
}
