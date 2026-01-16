/**
 * Core color primitives
 * These are base colors - semantic meaning is applied in contexts
 */
export declare const colors: {
    readonly white: "#ffffff";
    readonly black: "#000000";
    readonly gray: {
        readonly 50: "#f9fafb";
        readonly 100: "#f3f4f6";
        readonly 200: "#e5e7eb";
        readonly 300: "#d1d5db";
        readonly 400: "#9ca3af";
        readonly 500: "#6b7280";
        readonly 600: "#4b5563";
        readonly 700: "#374151";
        readonly 800: "#1f2937";
        readonly 900: "#111827";
    };
    readonly blue: {
        readonly 50: "#eff6ff";
        readonly 100: "#dbeafe";
        readonly 200: "#bfdbfe";
        readonly 300: "#93c5fd";
        readonly 400: "#60a5fa";
        readonly 500: "#3b82f6";
        readonly 600: "#2563eb";
        readonly 700: "#1d4ed8";
        readonly 800: "#1e40af";
        readonly 900: "#1e3a8a";
    };
    readonly green: {
        readonly 50: "#f0fdf4";
        readonly 100: "#dcfce7";
        readonly 200: "#bbf7d0";
        readonly 300: "#86efac";
        readonly 400: "#4ade80";
        readonly 500: "#22c55e";
        readonly 600: "#16a34a";
        readonly 700: "#15803d";
        readonly 800: "#166534";
        readonly 900: "#14532d";
    };
    readonly red: {
        readonly 50: "#fef2f2";
        readonly 100: "#fee2e2";
        readonly 200: "#fecaca";
        readonly 300: "#fca5a5";
        readonly 400: "#f87171";
        readonly 500: "#ef4444";
        readonly 600: "#dc2626";
        readonly 700: "#b91c1c";
        readonly 800: "#991b1b";
        readonly 900: "#7f1d1d";
    };
    readonly yellow: {
        readonly 50: "#fefce8";
        readonly 100: "#fef9c3";
        readonly 200: "#fef08a";
        readonly 300: "#fde047";
        readonly 400: "#facc15";
        readonly 500: "#eab308";
        readonly 600: "#ca8a04";
        readonly 700: "#a16207";
        readonly 800: "#854d0e";
        readonly 900: "#713f12";
    };
    readonly purple: {
        readonly 50: "#faf5ff";
        readonly 100: "#f3e8ff";
        readonly 500: "#a855f7";
        readonly 600: "#9333ea";
        readonly 700: "#7e22ce";
    };
};
export type ColorName = keyof typeof colors;
