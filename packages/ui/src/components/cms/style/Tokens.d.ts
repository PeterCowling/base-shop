import { type TokenMap } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";
interface TokensProps {
    tokens: TokenMap;
    baseTokens: TokenMap;
    onChange: (tokens: TokenMap) => void;
    focusToken?: string | null;
}
export default function Tokens({ tokens, baseTokens, onChange, focusToken, }: TokensProps): ReactElement;
export {};
//# sourceMappingURL=Tokens.d.ts.map