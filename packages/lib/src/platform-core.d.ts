declare module '@platform-core/dataRoot' {
  export const DATA_ROOT: string;
  export function resolveDataRoot(shop?: string): string;
}
