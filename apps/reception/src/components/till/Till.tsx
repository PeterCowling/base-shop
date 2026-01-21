/* src/components/till/Till.tsx */
import { memo } from "react";

import TillReconciliation from "./TillReconciliation";
import { TillDataProvider } from "../../context/TillDataContext";

const Till = () => (
  <TillDataProvider>
    <TillReconciliation />
  </TillDataProvider>
);

export default memo(Till);
