import { useEffect, useMemo } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import { clearBookingSearch } from "@/utils/bookingSearch";
import { clearRecoveryResumeParams, readRecoveryResumeStatus } from "@/utils/recoveryQuote";

type ReplaceLike = (href: string, options?: { scroll?: boolean }) => void;

type ParamsLike = URLSearchParams | ReadonlyURLSearchParams | null;

export function useRecoveryResumeFallback(params: ParamsLike, replace: ReplaceLike): {
  showRebuildQuotePrompt: boolean;
} {
  const resumeStatus = useMemo(() => readRecoveryResumeStatus(params), [params]);
  const showRebuildQuotePrompt = params?.get("rebuild_quote") === "1";

  useEffect(() => {
    if (resumeStatus.state !== "expired") return;
    clearBookingSearch();
    const next = clearRecoveryResumeParams(params);
    replace(`?${next.toString()}`, { scroll: false });
  }, [params, replace, resumeStatus.state]);

  return { showRebuildQuotePrompt };
}
