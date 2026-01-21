import { memo, useMemo } from "react";
import clsx from "clsx";

import type { FallbackTranslator } from "./fallback";
import type { DealStatus } from "./status";

type DealStatusBannerProps = {
  status: DealStatus;
  startLabel: string;
  endLabel: string;
  translate: FallbackTranslator;
};

function DealStatusBanner({ status, startLabel, endLabel, translate }: DealStatusBannerProps): JSX.Element {
  const message = useMemo(() => {
    if (status === "upcoming") {
      return translate("status.banner.upcoming", { startDate: startLabel });
    }
    if (status === "active") {
      return translate("status.banner.active", { endDate: endLabel });
    }
    return translate("status.banner.expired");
  }, [endLabel, startLabel, status, translate]);

  const classes = useMemo(() => {
    if (status === "upcoming") {
      return clsx(
        "border-sky-200",
        "bg-sky-50",
        "text-sky-900",
        "dark:border-sky-500/30",
        "dark:bg-sky-950/40",
        "dark:text-sky-50"
      );
    }
    if (status === "active") {
      return clsx(
        "border-emerald-200",
        "bg-emerald-50",
        "text-emerald-900",
        "dark:border-emerald-500/30",
        "dark:bg-emerald-950/40",
        "dark:text-emerald-50"
      );
    }

    return clsx(
      "border-slate-200",
      "bg-slate-50",
      "text-slate-900",
      "dark:border-slate-500/30",
      "dark:bg-slate-950/40",
      "dark:text-slate-50"
    );
  }, [status]);

  return (
    <div className={clsx("rounded-md", "border", "px-4", "py-3", "text-sm", classes)}>{message}</div>
  );
}

export default memo(DealStatusBanner);
