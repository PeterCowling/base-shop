// src/components/guides/CostBreakdown.tsx
import { type ComponentPropsWithoutRef, createElement, type ElementType,memo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

type Slice = {
  label: string;
  value: number; // percentage (0–100)
  color?: string;
};

type Namespace = Parameters<typeof useTranslation>[0];

type GridProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

function Grid<T extends ElementType = "div">({ as, className, ...props }: GridProps<T>) {
  return createElement(as ?? "div", { ...props, className: clsx("grid", className) });
}

function looseInterpolate(
  template: string,
  replacements: Record<string, string | number | undefined>,
): string {
  if (!template) {
    return template;
  }

  const replaceTokens = (source: string, pattern: RegExp) =>
    source.replace(pattern, (match, key) => {
      const replacement = replacements[key];
      return replacement === undefined ? match : String(replacement);
    });

  let result = template;
  // Support both i18next-style `{{token}}` placeholders and single-brace
  // fallbacks that appear in seeded copy. Keeping both passes ensures we can
  // derive sensible labels even before translations finish loading.
  result = replaceTokens(result, /\{\{\s*(\w+)\s*\}\}/g);
  result = replaceTokens(result, /\{(\w+)\}/g);

  return result;
}

type Props = {
  title?: string;
  namespace?: Namespace;
  lang?: string;
  slices?: Slice[];
  // Optional raw items; if provided, component derives percentage slices
  items?: { label: string; low: number; mid: number; high: number }[];
  currency?: string;
  budget?: "low" | "mid" | "high";
  size?: number; // px
  stroke?: number; // px
  className?: string;
  legend?: boolean;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

const SURFACE_RING_COLOR = "var(--color-brand-surface)" as const; // i18n-exempt -- DS-4170 [ttl=2026-12-31] Design token reference

const palette = [
  "var(--color-brand-primary)",
  "var(--color-brand-secondary)",
  "var(--color-brand-terra)",
  "var(--color-brand-bougainvillea)",
  "color-mix(in srgb, var(--color-brand-primary) 70%, var(--color-brand-surface))",
  "color-mix(in srgb, var(--color-brand-secondary) 70%, var(--color-brand-surface))",
  "color-mix(in srgb, var(--color-brand-terra) 70%, var(--color-brand-surface))",
] as const;

function CostBreakdown({
  title,
  namespace,
  lang,
  slices,
  items,
  currency,
  budget = "mid",
  size = 160,
  stroke = 14,
  className = "",
  legend = true,
}: Props): JSX.Element {
  const translationNamespace = namespace ?? "guides";
  const translationOptions = { useSuspense: false, ...(lang ? { lng: lang } : {}) };
  const { t } = useTranslation(translationNamespace, translationOptions);
  const resolvedTitle = title ?? t("labels.costBreakdownTitle");
  const rawCurrencySuffix = currency
    ? t("labels.costBreakdownCurrencySuffix", {
        currency,
        defaultValue: "",
      })
    : "";
  const currencySuffix = currency
    ? looseInterpolate(String(rawCurrencySuffix), { currency })
    : "";
  const shouldAutoSpaceSuffix = translationNamespace === "guides";
  const costSuffix = currency
    ? currencySuffix && shouldAutoSpaceSuffix && !/^[\s]/.test(currencySuffix)
      ? ` ${currencySuffix}`
      : currencySuffix
    : "";

  const formatSliceLabel = (slice: Slice) => {
    const template = t("labels.costBreakdownSliceLabel", {
      label: slice.label,
      value: slice.value,
      suffix: costSuffix,
      defaultValue: `${slice.label}: ${slice.value}%${costSuffix}`,
    }) as string;
    return looseInterpolate(template, {
      label: slice.label,
      value: `${slice.value}%`,
      suffix: costSuffix,
    });
  };

  // Derive slices from items if explicit slices not provided
  let computed: Slice[] = Array.isArray(slices) ? slices : [];
  if (computed.length === 0 && Array.isArray(items) && items.length > 0) {
    const level = budget;
    const total = items.reduce((sum, it) => sum + (it[level] ?? 0), 0);
    if (total > 0) {
      computed = items.map((it) => ({
        label: it.label,
        value: Math.max(0, Math.round(((it[level] ?? 0) / total) * 100)),
      }));
      // Adjust rounding drift to sum to 100
      const drift = 100 - computed.reduce((s, c) => s + c.value, 0);
      const firstSlice = computed[0];
      if (drift !== 0 && firstSlice) firstSlice.value += drift;
    }
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = cx - stroke / 2 - 2;
  let angle = 0;
  const segs = (computed || []).map((s, i) => {
    const sweep = (s.value / 100) * 360;
    const d = describeArc(cx, cy, r, angle, angle + sweep);
    const color = s.color || palette[i % palette.length];
    const ariaLabel = formatSliceLabel(s);
    const el = (
      <path
        key={`${s.label ?? "slice"}-${i}`}
        d={d}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        role="img"
        aria-label={ariaLabel}
      />
    );
    angle += sweep;
    return el;
  });

  return (
    <figure className={`not-prose my-6 ${className}`}>
      {resolvedTitle ? (
        <figcaption className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          {resolvedTitle}
        </figcaption>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={resolvedTitle || undefined}
          role="graphics-document"
        >
          <circle cx={cx} cy={cy} r={r} stroke={SURFACE_RING_COLOR} strokeWidth={stroke} fill="none" />
          {segs}
        </svg>
        {legend && computed.length > 0 && (
          <Grid
            as="ul"
            className="grid-cols-2 gap-x-6 gap-y-2 text-xs"
            aria-label={resolvedTitle || undefined}
          >
            {computed.map((s, i) => {
              const color = s.color || palette[i % palette.length];
              const formattedValue = `${s.value}%${costSuffix}`;
              const accessibleLabel = formatSliceLabel(s);
              return (
                <li key={s.label ?? `${i}`} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-3 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-100">{s.label}</span>
                  <span className="text-slate-600 dark:text-slate-300">{formattedValue}</span>
                  <span className="sr-only">{accessibleLabel}</span>
                </li>
              );
            })}
          </Grid>
        )}
      </div>
    </figure>
  );
}

export default memo(CostBreakdown);
