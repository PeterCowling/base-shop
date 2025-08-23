import * as React from "react";
export interface AccountInfo {
    name: string;
    email: string;
    avatar?: string;
}
export interface AccountPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    user: AccountInfo;
    onLogout?: () => void;
}
export declare const AccountPanel: React.ForwardRefExoticComponent<AccountPanelProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=AccountPanel.d.ts.map