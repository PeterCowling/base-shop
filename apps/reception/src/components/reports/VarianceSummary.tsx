/* src/components/reports/VarianceSummary.tsx */
import React from "react";

import { formatEuro } from "../../utils/format";

interface VarianceSummaryProps {
  openingCash: number;
  expectedCash: number;
  closingCash: number;
  variance: number;
  openingKeycards: number;
  expectedKeycards: number;
  closingKeycards: number;
  keycardVariance: number;
  keycardVarianceMismatch: boolean;
  beginningSafeBalance: number;
  endingSafeBalance: number;
  expectedSafeVariance: number;
  safeVariance: number;
  safeVarianceMismatch: boolean;
}

const VarianceSummary: React.FC<VarianceSummaryProps> = ({
  openingCash,
  expectedCash,
  closingCash,
  variance,
  openingKeycards,
  expectedKeycards,
  closingKeycards,
  keycardVariance,
  keycardVarianceMismatch,
  beginningSafeBalance,
  endingSafeBalance,
  expectedSafeVariance,
  safeVariance,
  safeVarianceMismatch,
}) => (
  <section>
    <h3 className="text-xl font-semibold mb-2">Variance</h3>
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="font-semibold">Cash</h4>
        <ul className="space-y-1">
          <li>
            <strong>Opening Cash:</strong> {formatEuro(openingCash)}
          </li>
          <li>
            <strong>Expected Closing Cash:</strong> {formatEuro(expectedCash)}
          </li>
          <li>
            <strong>Actual Closing Cash:</strong> {formatEuro(closingCash)}
          </li>
          <li>
            <strong>Variance:</strong> {formatEuro(variance)}
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold">Keycards</h4>
        <ul className="space-y-1">
          <li>
            <strong>Opening Keycards:</strong> {openingKeycards}
          </li>
          <li>
            <strong>Expected Closing Keycards:</strong> {expectedKeycards}
          </li>
          <li>
            <strong>Actual Closing Keycards:</strong> {closingKeycards}
          </li>
          <li className={keycardVarianceMismatch ? "text-error-main font-semibold" : undefined}>
            <strong>Keycard Variance:</strong> {keycardVariance}
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold">Safe</h4>
        <ul className="space-y-1">
          <li>
            <strong>Beginning Safe Balance:</strong> {formatEuro(beginningSafeBalance)}
          </li>
          <li>
            <strong>Ending Safe Balance:</strong> {formatEuro(endingSafeBalance)}
          </li>
          <li>
            <strong>Expected Safe Variance:</strong> {formatEuro(expectedSafeVariance)}
          </li>
          <li className={safeVarianceMismatch ? "text-error-main font-semibold" : undefined}>
            <strong>Actual Safe Variance:</strong> {formatEuro(safeVariance)}
          </li>
        </ul>
      </div>
    </div>
  </section>
);

export default VarianceSummary;
