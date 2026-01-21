"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatDuration,
  getTimeRemaining,
  parseTargetDate,
} from "@acme/date-utils";

interface Props {
  targetDate?: string;
  timezone?: string;
  completionText?: string;
  styles?: string;
  children?: React.ReactNode;
}

export default function CountdownTimer({
  targetDate,
  timezone,
  completionText,
  styles,
}: Props) {
  const target = useMemo(
    () => parseTargetDate(targetDate, timezone),
    [targetDate, timezone]
  );
  const [remaining, setRemaining] = useState(() =>
    target ? getTimeRemaining(target) : 0
  );

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      setRemaining(getTimeRemaining(target));
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;

  if (remaining <= 0) {
    return completionText ? <div className={styles}>{completionText}</div> : null;
  }

  return <div className={styles}>{formatDuration(remaining)}</div>;
}

