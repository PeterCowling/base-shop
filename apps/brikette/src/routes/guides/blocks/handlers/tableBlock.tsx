/**
 * Table block handler
 * Renders structured table data with headers and rows
 */

import type { TableBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

export function applyTableBlock(acc: BlockAccumulator, options: TableBlockOptions): void {
  const { id, title, titleKey, columns, rows } = options;

  if (!columns?.length || !rows?.length) {
    acc.warn("Table block requires columns and rows");
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
        <table className="min-w-full border-collapse rounded-lg border border-gray-200 bg-white text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 ${
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
                className="border-b border-gray-100 last:border-b-0 dark:border-gray-700"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-gray-600 dark:text-gray-400 ${
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
