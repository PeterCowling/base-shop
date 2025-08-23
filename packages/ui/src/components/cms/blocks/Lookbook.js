"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect, PointerEvent as ReactPointerEvent } from "react";
const SNAP = 5; // percent step for snapping
export default function Lookbook({ src, alt = "", hotspots = [], onHotspotsChange }) {
    const containerRef = useRef(null);
    const [points, setPoints] = useState(hotspots);
    const pointsRef = useRef(points);
    useEffect(() => {
        setPoints(hotspots);
    }, [hotspots]);
    useEffect(() => {
        pointsRef.current = points;
    }, [points]);
    const handlePointerDown = (index) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const container = containerRef.current;
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        const move = (ev) => {
            const rawX = ((ev.clientX - rect.left) / rect.width) * 100;
            const rawY = ((ev.clientY - rect.top) / rect.height) * 100;
            const snap = (v) => Math.max(0, Math.min(100, Math.round(v / SNAP) * SNAP));
            const next = pointsRef.current.map((p, i) => i === index ? { ...p, x: snap(rawX), y: snap(rawY) } : p);
            setPoints(next);
        };
        const up = () => {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
            onHotspotsChange?.(pointsRef.current);
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
    };
    return (_jsxs("div", { ref: containerRef, className: "relative h-full w-full", children: [src && _jsx("img", { src: src, alt: alt, className: "h-full w-full object-cover" }), points.map((p, idx) => (_jsx("div", { onPointerDown: handlePointerDown(idx), className: "absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full bg-primary", style: { left: `${p.x}%`, top: `${p.y}%` }, title: p.sku }, idx)))] }));
}
