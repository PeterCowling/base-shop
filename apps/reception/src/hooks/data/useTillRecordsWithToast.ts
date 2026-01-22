import { useEffect } from "react";

import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

import type { UseTillRecordsResult } from "./useTillRecords";
import useTillRecords from "./useTillRecords";

export default function useTillRecordsWithToast(): UseTillRecordsResult {
  const result = useTillRecords();

  useEffect(() => {
    if (result.error) {
      showToast(getErrorMessage(result.error), "warning");
    }
  }, [result.error]);

  return result;
}
