import { type ChangeEvent } from "react";
export type TokenMap = Record<`--${string}`, string>;
export interface TokenInfo {
    key: string;
    value: string;
    defaultValue?: string;
    isOverridden: boolean;
}
export interface UseTokenEditorResult {
    colors: TokenInfo[];
    fonts: TokenInfo[];
    others: TokenInfo[];
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
export declare function useTokenEditor(tokens: TokenMap, baseTokens: TokenMap, onChange: (tokens: TokenMap) => void): UseTokenEditorResult;
//# sourceMappingURL=useTokenEditor.d.ts.map