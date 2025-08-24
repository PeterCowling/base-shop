"use client";
import { useEffect, useMemo, useRef, useState } from "react";
const useViewport = (device) => {
    const [canvasWidth, setCanvasWidth] = useState(device.width);
    const [canvasHeight, setCanvasHeight] = useState(device.height);
    const [scale, setScale] = useState(1);
    const prevWidth = useRef(device.width);
    useEffect(() => {
        const prev = prevWidth.current;
        setCanvasWidth(device.width);
        setCanvasHeight(device.height);
        setScale(prev / device.width);
        const raf = requestAnimationFrame(() => setScale(1));
        prevWidth.current = device.width;
        return () => cancelAnimationFrame(raf);
    }, [device]);
    const viewportStyle = useMemo(() => ({
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top center",
        transition: "transform 0.3s ease",
    }), [canvasWidth, canvasHeight, scale]);
    const frameClass = useMemo(() => ({
        desktop: "",
        tablet: "rounded-xl border border-muted-foreground/40 p-2",
        mobile: "rounded-[2rem] border border-muted-foreground/40 p-4",
    }), []);
    return { canvasWidth, canvasHeight, scale, viewportStyle, frameClass };
};
export default useViewport;
