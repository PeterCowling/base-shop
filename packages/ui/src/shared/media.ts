/** Normalises legacy `/images/` assets to the modern `/img/` path. */
export function resolveAssetPath(path: string): string {
  return path.replace(/^\/images\//, "/img/");
}
