import * as React from "react";
export interface AppShellProps {
    header?: React.ReactNode;
    sideNav?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
export declare function AppShell(props: AppShellProps): React.JSX.Element;
