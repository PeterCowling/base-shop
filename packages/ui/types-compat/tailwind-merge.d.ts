declare module "tailwind-merge" {
  export interface ExtendTailwindMergeConfig {
    extend?: {
      theme?: {
        colors?: readonly string[];
      };
    };
  }
  export function extendTailwindMerge(config: ExtendTailwindMergeConfig): (...inputs: string[]) => string;
  export function twMerge(...inputs: string[]): string;
}
