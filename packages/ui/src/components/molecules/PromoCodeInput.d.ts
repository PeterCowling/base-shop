import * as React from "react";
export interface PromoCodeInputProps extends React.HTMLAttributes<HTMLFormElement> {
    onApply?: (code: string) => void;
    loading?: boolean;
}
export declare const PromoCodeInput: React.ForwardRefExoticComponent<PromoCodeInputProps & React.RefAttributes<HTMLFormElement>>;
//# sourceMappingURL=PromoCodeInput.d.ts.map