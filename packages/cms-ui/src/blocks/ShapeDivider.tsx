"use client";
import React from "react";

export type ShapePreset = "wave" | "tilt" | "curve" | "mountain" | "triangle";

export interface ShapeDividerProps {
  position: "top" | "bottom";
  preset: ShapePreset;
  color?: string;
  height?: number; // px
  flipX?: boolean; // mirror horizontally
}

function Path({ preset }: { preset: ShapePreset }) {
  switch (preset) {
    case "wave":
      return (
        <path d="M0 50 C 25 0, 75 100, 100 50 L 100 100 L 0 100 Z" />
      );
    case "curve":
      return (
        <path d="M0 60 C 20 20, 80 100, 100 60 L 100 100 L 0 100 Z" />
      );
    case "tilt":
      return <path d="M0 0 L 100 60 L 100 100 L 0 100 Z" />;
    case "triangle":
      return <path d="M0 100 L 50 0 L 100 100 Z" />;
    case "mountain":
      return (
        <path d="M0 100 L 20 60 L 40 90 L 60 30 L 80 80 L 100 50 L 100 100 Z" />
      );
    default:
      return null;
  }
}

export default function ShapeDivider({ position, preset, color = "currentColor", height = 48, flipX = false }: ShapeDividerProps) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height,
    [position]: 0,
    pointerEvents: "none",
    lineHeight: 0,
  } as React.CSSProperties;

   
  return (
    <div aria-hidden style={style}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ transform: `${position === "top" ? "scaleY(-1)" : ""} ${flipX ? " scaleX(-1)" : ""}`.trim() }}
      >
        <Path preset={preset} />
        <style>{`path{fill:${color};}`}</style>
      </svg>
    </div>
  );
   
}
