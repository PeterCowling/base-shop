import type { PageComponent } from "@acme/types";
export type ValidationIssue = {
    path: Array<string | number>;
    message: string;
};
export type ValidationResult = {
    ok: true;
} | {
    ok: false;
    errors: string[];
    issues?: ValidationIssue[];
};
export type ParentKind = "ROOT" | string;
export declare function validatePlacement(nodes: PageComponent[] | PageComponent, options: {
    parent: ParentKind;
    sectionsOnly?: boolean;
}): ValidationResult;
export declare function canDropChild(parent: ParentKind, child: string, sectionsOnly?: boolean): boolean;
