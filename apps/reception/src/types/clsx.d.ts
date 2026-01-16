declare module "clsx" {
  export default function clsx(
    ...classes: Array<string | Record<string, boolean> | undefined | null | false>
  ): string;
}
