"use client";
import { useState, useRef } from "react";
export default function useGuides(containerRef) {
    const siblingEdgesRef = useRef({ vertical: [], horizontal: [] });
    const [guides, setGuides] = useState({ x: null, y: null });
    const computeSiblingEdges = () => {
        const el = containerRef.current;
        const parent = el?.parentElement;
        if (!el || !parent)
            return { vertical: [], horizontal: [] };
        const vertical = [];
        const horizontal = [];
        Array.from(parent.children).forEach((child) => {
            if (child === el)
                return;
            const c = child;
            vertical.push(c.offsetLeft, c.offsetLeft + c.offsetWidth);
            horizontal.push(c.offsetTop, c.offsetTop + c.offsetHeight);
        });
        siblingEdgesRef.current = { vertical, horizontal };
        return siblingEdgesRef.current;
    };
    return { guides, setGuides, siblingEdgesRef, computeSiblingEdges };
}
