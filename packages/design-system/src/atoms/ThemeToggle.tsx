"use client";

import * as React from "react";

import { cn } from "../utils/style";

export type ThemeOption = "base" | "dark" | "system";

export interface ThemeToggleProps {
  /** Current theme value */
  theme: ThemeOption | string;
  /** Callback when theme changes */
  onThemeChange: (theme: ThemeOption) => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Show labels next to icons */
  showLabels?: boolean;
}

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx={12} cy={12} r={4} />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const MonitorIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width={20} height={14} x={2} y={3} rx={2} />
    <line x1={8} x2={16} y1={21} y2={21} />
    <line x1={12} x2={12} y1={17} y2={21} />
  </svg>
);

const themes: { value: ThemeOption; label: string; icon: typeof SunIcon }[] = [
  { value: "base", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

/**
 * ThemeToggle - A segmented control for switching between light, dark, and system themes.
 *
 * @example
 * ```tsx
 * import { useTheme } from '@acme/platform-core/contexts/ThemeContext';
 * import { ThemeToggle } from '@acme/ui';
 *
 * function Settings() {
 *   const { theme, setTheme } = useTheme();
 *   return <ThemeToggle theme={theme} onThemeChange={setTheme} />;
 * }
 * ```
 */
export const ThemeToggle = React.forwardRef<HTMLDivElement, ThemeToggleProps>(
  ({ theme, onThemeChange, className, size = "sm", showLabels = false }, ref) => {
    const sizeClasses = {
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
      sm: "h-8 text-sm",
      md: "h-10 text-base",
    };

    const iconSizeClasses = {
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
      sm: "h-4 w-4",
      md: "h-5 w-5",
    };

    const buttonPaddingClasses = {
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
      sm: showLabels ? "px-2.5 gap-1.5" : "px-2",
      md: showLabels ? "px-3 gap-2" : "px-2.5",
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Theme selection"
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          "inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5",
          sizeClasses[size],
          className
        )}
      >
        {themes.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              onClick={() => onThemeChange(value)}
              className={cn(
                // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
                "inline-flex h-full items-center justify-center rounded-md transition-colors transition-shadow motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                buttonPaddingClasses[size],
                isActive
                  ? // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
                    "bg-bg text-fg shadow-sm"
                  : // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
                    "text-fg-muted hover:text-fg hover:bg-bg/50"
              )}
            >
              <Icon className={iconSizeClasses[size]} />
              {showLabels && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
