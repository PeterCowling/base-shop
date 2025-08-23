import type { TokenMap } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";
interface PresetsProps {
    tokens: TokenMap;
    baseTokens: TokenMap;
    onChange: (tokens: TokenMap) => void;
}
export default function Presets({ tokens, onChange, }: PresetsProps): ReactElement;
export {};
//# sourceMappingURL=Presets.d.ts.map