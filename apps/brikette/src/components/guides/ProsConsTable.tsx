// src/components/guides/ProsConsTable.tsx
import { memo } from "react";
import Link from "next/link";

type Row = { title: string; pros: string[]; cons: string[]; href?: string };
type Props = { rows: Row[]; className?: string };

function ProsConsTable({ rows, className = "" }: Props): JSX.Element | null {
  if (!rows?.length) return null;
  return (
    <div className={`not-prose my-6 overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-2 bg-surface-1 p-2 text-start">Option</th>
            <th className="border border-2 bg-surface-1 p-2 text-start">Pros</th>
            <th className="border border-2 bg-surface-1 p-2 text-start">Cons</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border border-2 p-2 align-top">
                <strong>
                  {r.href ? (
                    <Link
                      href={r.href}
                      prefetch={true}
                      className="text-brand-primary underline-offset-4 transition hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 dark:text-brand-secondary"
                    >
                      {r.title}
                    </Link>
                  ) : (
                    r.title
                  )}
                </strong>
              </td>
              <td className="border border-2 p-2 align-top">
                <ul className="list-disc pl-4">
                  {r.pros.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
              </td>
              <td className="border border-2 p-2 align-top">
                <ul className="list-disc pl-4">
                  {r.cons.map((c, j) => (
                    <li key={j}>{c}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ProsConsTable);

