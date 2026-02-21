/**
 * Table block handler
 * Renders structured table data with headers and rows
 */

import type { TableBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

export function applyTableBlock(acc: BlockAccumulator, options: TableBlockOptions): void {
  const { id, title, titleKey, columns, rows } = options;

  if (!columns?.length || !rows?.length) {
    acc.warn("Table block requires columns and rows"); // eslint-disable-line ds/no-hardcoded-copy -- CFL-99 pre-existing: dev warning
    return;
  }

  acc.addSlot("article", (context) => {
    const resolvedTitle = titleKey
      ? context.translateGuides(`content.${context.guideKey}.${titleKey}`)
      : title;

    return (
      <div className="not-prose my-8 overflow-x-auto" id={id}>
        {resolvedTitle && (
          <h3 className="mb-4 text-xl font-semibold text-brand-heading dark:text-brand-surface">
            {resolvedTitle}
          </h3>
        )}
        <table className="min-w-full border-collapse rounded-lg border border-1 bg-panel text-sm shadow-sm">
          <thead>
            <tr className="border-b border-1 bg-surface-1">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-secondary ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-1 last:border-b-0"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-muted ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {row[col.key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}
