import { ChangeEvent } from "react";
export type TokenMap = Record<`--${string}`, string>;
export interface UseTokenEditorResult {
    colors: Array<[string, string]>;
    fonts: Array<[string, string]>;
    others: Array<[string, string]>;
    sansFonts: string[];
    monoFonts: string[];
    newFont: string;
    googleFonts: string[];
    setNewFont: (v: string) => void;
    setToken: (key: string, value: string) => void;
    handleUpload: (type: "sans" | "mono", e: ChangeEvent<HTMLInputElement>) => void;
    addCustomFont: () => void;
    setGoogleFont: (type: "sans" | "mono", name: string) => void;
}
export declare function useTokenEditor(tokens: TokenMap, onChange: (tokens: TokenMap) => void): UseTokenEditorResult;
