interface ColorInputProps {
    value: string;
    onChange: (value: string) => void;
}
export declare function getContrast(color1: string, color2: string): number;
export declare function suggestContrastColor(color: string, reference: string, ratio?: number): string | null;
export declare function ColorInput({ value, onChange }: ColorInputProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ColorInput.d.ts.map