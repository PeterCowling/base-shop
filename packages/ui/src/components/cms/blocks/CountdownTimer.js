import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { parseTargetDate, getTimeRemaining, formatDuration, } from "@acme/date-utils";
export default function CountdownTimer({ targetDate, timezone, completionText, styles, }) {
    const target = useMemo(() => parseTargetDate(targetDate, timezone), [targetDate, timezone]);
    const [remaining, setRemaining] = useState(() => target ? getTimeRemaining(target) : 0);
    useEffect(() => {
        if (!target)
            return;
        const tick = () => {
            setRemaining(getTimeRemaining(target));
        };
        const id = setInterval(tick, 1000);
        tick();
        return () => clearInterval(id);
    }, [target]);
    if (!target)
        return null;
    if (remaining <= 0) {
        return completionText ? _jsx("div", { className: styles, children: completionText }) : null;
    }
    return _jsx("div", { className: styles, children: formatDuration(remaining) });
}
