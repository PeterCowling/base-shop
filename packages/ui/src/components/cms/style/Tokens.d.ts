import { type TokenMap } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";
interface TokensProps {
    tokens: TokenMap;
    baseTokens: TokenMap;
    onChange: (tokens: TokenMap) => void;
    focusToken?: string | null;
    onRenameToken?: (tokenKey: string, nextKey: string) => void;
    onReplaceColor?: (tokenKey: string, nextValue: string) => void;
}
export default function Tokens({ tokens, baseTokens, onChange, focusToken, onRenameToken, onReplaceColor, }: TokensProps): ReactElement;
export {};
//# sourceMappingURL=Tokens.d.ts.map