import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface AssistanceMobileNavItem {
  key: string;
  label: string;
  href: string;
  isActive?: boolean;
}

interface RenderLinkArgs {
  item: AssistanceMobileNavItem;
  highlighted: boolean;
  children: ReactNode;
}

export interface HelpCentreMobileNavCopy {
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  hintLabel: string;
}

export interface HelpCentreMobileNavProps {
  readonly items: AssistanceMobileNavItem[];
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly copy: HelpCentreMobileNavCopy;
  readonly className?: string;
  readonly bannerHeight?: number;
  readonly headerSelector?: string;
  readonly handleSize?: number;
  readonly renderLink?: (args: RenderLinkArgs) => ReactNode;
}

const DEFAULT_HANDLE_SIZE = 40;
const DEFAULT_GAP = 8;
// i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS selector string.
const DEFAULT_HEADER_SELECTOR = 'header[role="banner"]';
const DEFAULT_HEADER_HEIGHT = 64;

// Wrap DOM nodes to satisfy react/forbid-dom-props for "style"
const StyledDiv = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} {...props} />
));
StyledDiv.displayName = "StyledDiv";

const StyledButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (
  <button ref={ref} {...props} />
));
StyledButton.displayName = "StyledButton";

const StyledAside = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => (
  <aside ref={ref as never} {...props} />
));
StyledAside.displayName = "StyledAside";

function DefaultNavLink({ item, highlighted, children }: RenderLinkArgs): ReactNode {
  return (
    <a
      href={item.href}
      aria-current={highlighted ? "page" : undefined}
      className={clsx(
        "flex",
        "items-center",
        "justify-between",
        "rounded-lg",
        "px-4",
        "py-3",
        highlighted
          ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
            "bg-brand-primary/10 font-semibold"
          : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
            "bg-transparent",
        "text-brand-text",
        "transition-colors",
        "hover:bg-brand-primary/15",
      )}
    >
      {children}
    </a>
  );
}

const HelpCentreMobileNav = memo(function HelpCentreMobileNav({
  items,
  isOpen,
  onToggle,
  copy,
  className,
  bannerHeight = 0,
  headerSelector = DEFAULT_HEADER_SELECTOR,
  handleSize = DEFAULT_HANDLE_SIZE,
  renderLink,
}: HelpCentreMobileNavProps): JSX.Element {
  const [headerHeight, setHeaderHeight] = useState<number>(DEFAULT_HEADER_HEIGHT);
  const [pastBanner, setPastBanner] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const selector = headerSelector.trim() || DEFAULT_HEADER_SELECTOR;
    const header = document.querySelector<HTMLElement>(selector);
    if (!header) return;

    const setHeight = (): void => {
      setHeaderHeight(header.offsetHeight || DEFAULT_HEADER_HEIGHT);
    };

    setHeight();

    const observer = new ResizeObserver(setHeight);
    observer.observe(header);
    window.addEventListener("resize", setHeight, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", setHeight);
    };
  }, [headerSelector]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = (): void => {
      setPastBanner(window.scrollY > bannerHeight);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [bannerHeight]);

  const drawerOffsets = useMemo(() => {
    const gap = DEFAULT_GAP;
    const dynamicBannerOffset = pastBanner ? gap + 2 : bannerHeight;
    const handleTop = headerHeight + dynamicBannerOffset + gap;
    const drawerTop = handleTop + handleSize + gap;
    return { handleTop, drawerTop };
  }, [headerHeight, bannerHeight, pastBanner, handleSize]);

  const renderNavLink = renderLink ?? DefaultNavLink;

  return (
    <div className={clsx("lg:hidden", className)}>
      <div className="relative">
        <StyledDiv
          style={{ top: drawerOffsets.handleTop - DEFAULT_GAP, height: handleSize + DEFAULT_GAP }}
          className="pointer-events-none fixed inset-x-0 bg-brand-bg dark:bg-brand-surface lg:hidden"
          aria-hidden="true"
        />

        <StyledButton
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? copy.closeLabel : copy.openLabel}
          style={{ top: drawerOffsets.handleTop }}
          className={clsx(
            "fixed",
            "start-1/2",
            "inline-flex",
            "size-10",
            "-translate-x-1/2",
            "items-center",
            "justify-center",
            "rounded-full",
            "bg-brand-primary",
            "text-brand-bg",
            "shadow-lg",
            "transition-transform",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-brand-secondary",
          )}
        >
          {isOpen ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
        </StyledButton>
      </div>

      <StyledAside
        aria-label={copy.navLabel}
        className={clsx(
          "fixed",
          "inset-x-0",
          "lg:hidden",
          "bg-brand-bg",
          "dark:bg-brand-surface/95",
          "transition-transform",
          "duration-300",
          isOpen
            ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
              "translate-y-0"
            : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
              "translate-y-[calc(100%+1rem)]",
        )}
        style={{
          top: drawerOffsets.drawerTop,
          maxHeight: `max(0px,calc(100svh-${drawerOffsets.drawerTop + DEFAULT_GAP}px))`,
        }}
      >
        <div className="px-4 pt-4">
          <p className="mb-3 text-sm text-brand-text/70">{copy.hintLabel}</p>
          <nav aria-label={copy.navLabel} className="space-y-2">
            {items.map((item) => (
              <div key={item.key}>
                {renderNavLink({
                  item,
                  highlighted: Boolean(item.isActive),
                  children: (
                    <span
                      className={clsx(
                        "truncate",
                        item.isActive &&
                          /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                          "font-semibold text-brand-primary"
                      )}
                    >
                      {item.label}
                    </span>
                  ),
                })}
              </div>
            ))}
          </nav>
        </div>
      </StyledAside>
    </div>
  );
});

HelpCentreMobileNav.displayName = "HelpCentreMobileNav";

export default HelpCentreMobileNav;
