// packages/ui/src/components/cms/blocks/SocialProof.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
/** Display recent order events like "Alice bought X 5 min ago" */
export default function SocialProof({ source, frequency = 5000 }) {
    const [events, setEvents] = useState([]);
    const [index, setIndex] = useState(0);
    useEffect(() => {
        let active = true;
        fetch(source)
            .then((res) => res.json())
            .then((data) => {
            if (active)
                setEvents(data);
        })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, [source]);
    useEffect(() => {
        if (events.length === 0)
            return;
        const id = setInterval(() => setIndex((i) => (i + 1) % events.length), frequency);
        return () => clearInterval(id);
    }, [events, frequency]);
    if (events.length === 0)
        return null;
    const event = events[index];
    const minutes = Math.floor((Date.now() - event.timestamp) / 60000);
    return (_jsx("div", { className: "text-sm", children: `${event.customer} bought ${event.product} ${minutes} min ago` }));
}
