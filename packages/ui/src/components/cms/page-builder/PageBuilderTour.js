"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
export const STATUS = { FINISHED: "finished", SKIPPED: "skipped" };
function Joyride({ steps: _steps, run, callback, }) {
  useEffect(() => {
    if (run) {
      callback?.({ status: STATUS.FINISHED });
    }
  }, [run, callback]);
  return null;
}
export default function PageBuilderTour({ steps, run, callback }) {
  return (
    _jsx(Joyride, { steps: steps, run: run, continuous: true, showSkipButton: true, callback: callback, styles: { options: { zIndex: 10000 } } })
  );
}
