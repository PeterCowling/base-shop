"use client";
import { useState } from "react";
import { cn } from "../../../../utils/style";
import { Inline } from "../../../atoms/primitives";
import { useTranslations } from "@acme/i18n";

export interface TabsAccordionContainerProps {
  children?: React.ReactNode;
  mode?: "tabs" | "accordion";
  tabs?: string[]; // titles for each child panel
  className?: string;
}

export default function TabsAccordionContainer({ children, mode = "tabs", tabs, className }: TabsAccordionContainerProps) {
  const t = useTranslations();
  // Normalize children to array so React keys are preserved and accessible
  const items = (Array.isArray(children) ? children : children ? [children] : []) as React.ReactNode[];
  // Use provided tab titles; otherwise, fall back to an i18n-enabled label.
  const titles =
    tabs && tabs.length === items.length
      ? tabs
      : items.map((_, i) => String(t("cms.tabs.default", { n: i + 1 })));
  const [active, setActive] = useState(0);

  if (mode === "accordion") {
    return (
      <div className={className}>
        {items.map((child, i) => {
          const itemKey = (child as unknown as { key?: string | number } | null)?.key ?? titles[i] ?? i;
          return (
          <div key={String(itemKey)} className="border-b">
            <button
              type={"button" /* i18n-exempt -- I18N-0003 [ttl=2025-01-31] HTML attribute value */}
              // i18n-exempt -- I18N-0003 [ttl=2025-01-31] CSS utility class strings
              className="w-full px-3 py-2 text-start font-medium min-h-10 min-w-10"
              onClick={() => setActive((prev) => (prev === i ? -1 : i))}
              aria-expanded={active === i}
            >
              {titles[i]}
            </button>
            {(() => {
              // i18n-exempt -- ABC-123 [ttl=2025-01-31] CSS utility classes only
              // i18n-exempt -- ABC-123 [ttl=2025-01-31]
              const contentBase = "overflow-hidden transition-all";
              // i18n-exempt -- ABC-123 [ttl=2025-01-31]
              const contentOpen = "max-h-[1000px]";
              // i18n-exempt -- ABC-123 [ttl=2025-01-31]
              const contentClosed = "max-h-0";
              const contentClass = cn(
                contentBase,
                active === i ? contentOpen : contentClosed,
              );
              return <div className={contentClass}>{child}</div>;
            })()}
          </div>
        );})}
      </div>
    );
  }

  // tabs mode
  return (
    <div className={className}>
      {/* i18n-exempt -- I18N-0003 [ttl=2025-01-31] CSS utility class strings */}
      <Inline gap={2} className="border-b" role="tablist">
        {items.map((child, i) => {
          const itemKey = (child as unknown as { key?: string | number } | null)?.key ?? titles[i] ?? i;
          const title = titles[i];
          // i18n-exempt -- ABC-123 [ttl=2025-01-31] CSS utility classes only
          // i18n-exempt -- ABC-123 [ttl=2025-01-31]
          const base = "-mb-px border-b-2 px-3 py-2 text-sm min-h-10 min-w-10";
          // i18n-exempt -- ABC-123 [ttl=2025-01-31]
          const stateActive = "border-foreground";
          // i18n-exempt -- ABC-123 [ttl=2025-01-31]
          const stateInactive = "border-transparent text-muted-foreground";
          const btnClass = cn(base, active === i ? stateActive : stateInactive);
          return (
            <button
              key={String(itemKey)}
              type={"button" /* i18n-exempt -- I18N-0003 [ttl=2025-01-31] HTML attribute value */}
              className={btnClass} /* i18n-exempt -- I18N-0003 [ttl=2025-01-31] CSS utility classes only */
              onClick={() => setActive(i)}
              aria-selected={active === i}
              role={"tab" /* i18n-exempt -- I18N-0003 [ttl=2025-01-31] WAI-ARIA role value */}
            >
              {/* i18n-exempt -- I18N-0003 [ttl=2025-01-31] consumer-provided tab title */}
              {title}
            </button>
          );
        })}
      </Inline>
      <div className="py-3" role="tabpanel">{items[active]}</div>
    </div>
  );
}
