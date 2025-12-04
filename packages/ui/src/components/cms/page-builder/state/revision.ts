export function computeRevisionId(input: unknown): string {
  try {
    const json = JSON.stringify(input ?? {});
    let hash = 0;
    for (let i = 0; i < json.length; i += 1) {
      hash = (hash << 5) - hash + json.charCodeAt(i);
      hash |= 0;
    }
    return `rev-${(hash >>> 0).toString(16)}`;
  } catch {
    return "rev-unknown";
  }
}
