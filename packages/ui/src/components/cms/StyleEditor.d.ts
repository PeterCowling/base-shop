import type { TokenMap } from "../../hooks/useTokenEditor";
interface StyleEditorProps {
    tokens: TokenMap;
    baseTokens: TokenMap;
    onChange: (tokens: TokenMap) => void;
    /** Token key to focus when editor opens */
    focusToken?: string | null;
}
export default function StyleEditor(props: StyleEditorProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StyleEditor.d.ts.map