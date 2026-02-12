/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] layout class maps are not user-facing */
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type Ref,
} from "react";
import clsx from "clsx";

type SectionPadding = "none" | "narrow" | "default" | "wide";
type SectionWidth = "constrained" | "full";

const PADDING_MAP: Record<SectionPadding, string> = {
  none: "",
  narrow: "px-4 py-6",
  default: "px-4 py-8",
  wide: "px-6 py-12",
};

const WIDTH_MAP: Record<SectionWidth, string> = {
  constrained: "mx-auto w-full max-w-screen-2xl",
  full: "w-full",
};

type SectionProps<T extends ElementType> = {
  as?: T;
  padding?: SectionPadding;
  width?: SectionWidth;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "padding">;

type SectionComponent = <T extends ElementType = "section">(
  props: SectionProps<T> & { ref?: Ref<HTMLElement> }
) => ReactElement;

const Section = (<T extends ElementType = "section">(
  {
    ref,
    as,
    padding = "default",
    width = "constrained",
    className,
    ...rest
  }: SectionProps<T> & {
    ref?: Ref<HTMLElement>;
  }
) => {
  const Component = (as ?? "section") as ElementType;
  return (
    <Component
      ref={ref as never}
      className={clsx(WIDTH_MAP[width], PADDING_MAP[padding], className)}
      {...rest}
    />
  );
}) as SectionComponent;


export { Section };
export type { SectionProps };
