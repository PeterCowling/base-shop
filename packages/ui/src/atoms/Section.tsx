/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] layout class maps are not user-facing */
import { type ComponentPropsWithoutRef, type CSSProperties, type ElementType, forwardRef, type Ref } from "react";
import clsx from "clsx";

type SectionPadding = "none" | "narrow" | "default" | "wide";
type SectionWidth = "constrained" | "full";

const PADDING_MAP: Record<SectionPadding, string> = {
  none: "",
  narrow: "px-4 py-6",
  default: "px-4 py-8",
  wide: "px-6 py-12",
};

/**
 * Profile-driven gap applied via inline style. The `var()` falls back to the
 * padding already set by the Tailwind class, so apps without a profile see no
 * change. Only the `default` and `wide` presets opt in — `none` and `narrow`
 * are deliberate overrides that should not be touched by the profile.
 */
const PROFILE_GAP_STYLE: Partial<Record<SectionPadding, CSSProperties>> = {
  default: { paddingBlock: "var(--profile-space-section-gap, 2rem)" },
  wide: { paddingBlock: "var(--profile-space-section-gap, 3rem)" },
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
) => JSX.Element;

const Section = forwardRef(
  <T extends ElementType = "section">(
    { as, padding = "default", width = "constrained", className, style, ...rest }: SectionProps<T>,
    ref: Ref<HTMLElement>
  ) => {
    const Component = (as ?? "section") as ElementType;
    const profileGap = PROFILE_GAP_STYLE[padding];
    const mergedStyle = profileGap ? { ...profileGap, ...style } : style;
    return (
      <Component
        ref={ref as never}
        className={clsx(WIDTH_MAP[width], PADDING_MAP[padding], className)}
        style={mergedStyle}
        {...rest}
      />
    );
  }
) as SectionComponent & { displayName?: string };

Section.displayName = "Section";

export { Section };
export type { SectionProps };
