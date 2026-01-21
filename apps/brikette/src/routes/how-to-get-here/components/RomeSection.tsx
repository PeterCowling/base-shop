import { Link } from "react-router-dom";

import { renderRichText, resolveHref } from "../richText";
import { RomeTravelPlanner } from "../rome/RomeTravelPlanner";
import { externalLinkClass } from "../styles";
import type { RomeTable } from "../types";

export type RomeSectionProps = {
  showRomePlanner: boolean;
  romeTitle: string;
  romeDescription: string;
  romeTable: RomeTable;
  internalBasePath: string;
};

export function RomeSection({
  showRomePlanner,
  romeTitle,
  romeDescription,
  romeTable,
  internalBasePath,
}: RomeSectionProps) {
  if (showRomePlanner) {
    return <RomeTravelPlanner />;
  }

  return (
    <>
      <h2 className="text-center text-2xl font-semibold text-brand-heading dark:text-brand-surface">
        {romeTitle}
      </h2>
      <p className="mt-4 text-center text-base leading-relaxed">{romeDescription}</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-brand-outline/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-outline/40 text-start text-sm">
            <thead>
              <tr className="text-brand-heading/80 dark:text-brand-surface/80">
                <th scope="col" className="w-56 px-4 py-3 font-semibold">
                  {romeTable.headers.route}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {romeTable.headers.toRome}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {romeTable.headers.toHostel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-outline/20">
              {romeTable.options.map((option) => {
                const resolvedRouteHref = resolveHref(option.route, internalBasePath);
                return (
                  <tr key={`${option.route.label}-${resolvedRouteHref}`} className="align-top">
                    <th scope="row" className="p-4 text-sm font-semibold">
                      {option.route.internal ? (
                        <Link className={externalLinkClass} prefetch="intent" to={resolvedRouteHref}>
                          {option.route.label}
                        </Link>
                      ) : (
                        <a
                          className={externalLinkClass}
                          href={resolvedRouteHref}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {option.route.label}
                        </a>
                      )}
                      {option.note ? (
                        <div className="mt-3 text-xs font-normal text-brand-text/80 dark:text-brand-surface/70">
                          {renderRichText(option.note, internalBasePath)}
                        </div>
                      ) : null}
                    </th>
                    {[option.toRome, option.toHostel].map((column) => (
                      <td key={column.heading} className="p-4 align-top text-sm">
                        <ul className="space-y-2">
                          {column.points.map((point, index) => (
                            <li key={`${column.heading}-${index}`} className="leading-relaxed">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
