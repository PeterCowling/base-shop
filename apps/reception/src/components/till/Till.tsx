/* src/components/till/Till.tsx */
import { memo } from "react";

import { TillDataProvider } from "../../context/TillDataContext";

import TillReconciliation from "./TillReconciliation";

const Till = () => (
  <TillDataProvider>
    <TillReconciliation />
  </TillDataProvider>
);

export default memo(Till);
