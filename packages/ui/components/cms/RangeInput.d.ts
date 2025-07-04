/// <reference types="react" />
interface RangeInputProps {
    value: string;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
}
export declare function RangeInput({ value, onChange, min, max, }: RangeInputProps): import("react").JSX.Element;
export {};
