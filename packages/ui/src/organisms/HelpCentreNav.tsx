import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";
import {
  Fragment,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useState,
  type HTMLAttributes,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";

export interface AssistanceNavItem {
  key: string;
  label: string;
  href: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  isActive?: boolean;
}

interface RenderLinkArgs {
  item: AssistanceNavItem;
  highlighted: boolean;
  defaultClassName: string;
  children: ReactNode;
}

export interface HelpCentreNavProps {
  readonly items: AssistanceNavItem[];
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly sidebarLabel: string;
  readonly openLabel: string;
  readonly closeLabel: string;
  readonly className?: string;
  readonly headerSelector?: string;
  readonly renderLink?: (args: RenderLinkArgs) => ReactNode;
}

const DEFAULT_HEADER_SELECTOR = "header" as const;

// Wrap DOM node to satisfy react/forbid-dom-props for "style"
const PositionedAside = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => (
  <aside ref={ref as never} {...props} />
));
PositionedAside.displayName = "PositionedAside";

function DefaultNavLink({ item, highlighted, defaultClassName, children }: RenderLinkArgs): ReactNode {
  return (
    <a href={item.href} className={defaultClassName} aria-current={highlighted ? "page" : undefined}>
      {children}
    </a>
  );
}

const HelpCentreNav = memo(function HelpCentreNav({
  items,
  isOpen,
  onToggle,
  sidebarLabel,
  openLabel,
  closeLabel,
  className,
  headerSelector = DEFAULT_HEADER_SELECTOR,
  renderLink,
}: HelpCentreNavProps): JSX.Element {
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const selector = headerSelector.trim() || DEFAULT_HEADER_SELECTOR;
    const header = document.querySelector<HTMLElement>(selector);
    if (!header) return;

    const updateOffset = (): void => {
      const { bottom } = header.getBoundingClientRect();
      setHeaderOffset(Math.max(0, bottom));
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    window.addEventListener("scroll", updateOffset, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateOffset);
    };
  }, [headerSelector]);

  const linkClasses = useCallback(
    (highlighted: boolean): string =>
      clsx(
        "group",
        "flex",
        "items-center",
        "gap-3",
        "rounded-md",
        "px-3",
        "py-2",
        "pr-[40px]",
        highlighted
          ? ["font-semibold", "text-brand-primary", "dark:text-brand-secondary"]
          : ["text-brand-text", "dark:text-brand-surface"],
        "hover:bg-brand-surface/60",
        "dark:hover:bg-brand-text/60",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-brand-primary",
        "transition-colors",
      ),
    [],
  );

  const renderNavLink = renderLink ?? DefaultNavLink;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? closeLabel : openLabel}
        className={clsx(
          "hidden",
          "lg:inline-flex",
          "lg:fixed",
          "lg:end-0",
          "lg:top-1/2",
          "-translate-y-1/2",
          "items-center",
          "justify-center",
          "rounded-s-md",
          "bg-brand-primary",
          "text-brand-bg",
          "shadow-lg",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-brand-secondary",
          "min-h-10",
          "min-w-10",
          "z-10",
        )}
      >
        {isOpen ? <ArrowRight className="size-5" /> : <ArrowLeft className="size-5" />}
      </button>

      <PositionedAside
        style={{ top: headerOffset }}
        className={clsx(
          "hidden",
          "lg:block",
          "lg:fixed",
          "lg:bottom-0",
          "lg:end-0",
          "overflow-y-auto",
          "bg-brand-bg",
          "transition-transform",
          "duration-300",
          "ease-out",
          "dark:bg-brand-surface/90",
          isOpen ? "translate-x-0" : "translate-x-full",
          className,
        )}
        aria-label={sidebarLabel}
      >
        <div
          className={clsx(
            "sticky",
            "top-0",
            "z-10",
            "flex",
            "items-center",
            "justify-between",
            "gap-4",
            "px-4",
            "pt-4",
            "pb-3",
            "bg-brand-bg",
            "dark:bg-brand-surface/90",
            "border-b",
            "border-brand-outline/20",
            "dark:border-brand-outline/40",
          )}
        >
          <p className="text-sm font-semibold text-brand-text dark:text-brand-bg/80" aria-hidden="true">
            {sidebarLabel}
          </p>
          <button
            type="button"
            onClick={onToggle}
            aria-label={closeLabel}
            className={clsx(
              "inline-flex",
              "size-10",
              "items-center",
              "justify-center",
              "rounded-full",
              "border",
              "border-brand-primary/25",
              "bg-brand-primary/10",
              "text-brand-primary",
              "transition-colors",
              "hover:bg-brand-primary/20",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-brand-primary",
            )}
          >
            <ArrowRight className="size-4" />
          </button>
        </div>

        <nav className="px-4 pb-4 pt-2">
          <h2 className="sr-only">{sidebarLabel}</h2>
          <ul className="space-y-1">
            {items.map((item) => {
              const highlighted = Boolean(item.isActive);
              const Icon = item.icon;
              const defaultClassName = linkClasses(highlighted);
              const content = (
                <Fragment>
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      className={clsx(
                        "size-5",
                        "flex-none",
                        "transition-opacity",
                        highlighted ? "opacity-100" : "opacity-60",
                      )}
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </Fragment>
              );

              return (
                <li key={item.key}>
                  {renderNavLink({
                    item,
                    highlighted,
                    defaultClassName,
                    children: content,
                  })}
                </li>
              );
            })}
          </ul>
        </nav>
      </PositionedAside>
    </div>
  );
});

HelpCentreNav.displayName = "HelpCentreNav";

export default HelpCentreNav;
