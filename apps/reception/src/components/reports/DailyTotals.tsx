/* src/components/reports/DailyTotals.tsx */
import React from "react";
import { formatEuro } from "../../utils/format";

interface DailyTotalsProps {
  totals: { cash: number; card: number; other: number };
}

const DailyTotals: React.FC<DailyTotalsProps> = ({ totals }) => (
  <section>
    <h3 className="text-xl font-semibold mb-2">Daily Totals</h3>
    <ul className="space-y-1 text-sm">
      <li>
        <strong>Cash:</strong> {formatEuro(totals.cash)}
      </li>
      <li>
        <strong>Card:</strong> {formatEuro(totals.card)}
      </li>
      <li>
        <strong>Other:</strong> {formatEuro(totals.other)}
      </li>
    </ul>
  </section>
);

export default DailyTotals;
