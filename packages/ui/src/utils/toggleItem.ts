export function toggleItem<T>(array: readonly T[], value: T): T[] {
  const index = array.indexOf(value);
  return index === -1
    ? [...array, value]
    : [...array.slice(0, index), ...array.slice(index + 1)];
}
