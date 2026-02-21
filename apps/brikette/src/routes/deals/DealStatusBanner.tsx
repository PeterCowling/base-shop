import { memo } from "react";
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
  const message = status === "upcoming"
    ? translate("status.banner.upcoming", { startDate: startLabel })
    : status === "active"
      ? translate("status.banner.active", { endDate: endLabel })
      : translate("status.banner.expired");

  const classes = status === "upcoming"
    ? clsx("border-info", "bg-info-soft", "text-info-fg")
    : status === "active"
      ? clsx("border-success", "bg-success-soft", "text-success-fg")
      : clsx("border-1", "bg-surface-1", "text-fg");

  return (
    <div className={clsx("rounded-md", "border", "px-4", "py-3", "text-sm", classes)}>{message}</div>
  );
}

export default memo(DealStatusBanner);
