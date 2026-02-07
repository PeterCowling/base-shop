// Mock for @/lib/buildCfImageUrl - avoids import.meta in Jest
export default function buildCfImageUrl(
  src: string,
  _options?: Record<string, unknown>,
): string {
  return src;
}
