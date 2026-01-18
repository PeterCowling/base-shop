import type { PageComponent } from "@acme/types";
import { type ParentKind } from "./placement";
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
export declare function validateTemplateCreation(components: PageComponent[], options: {
    parent: ParentKind;
    sectionsOnly?: boolean;
}): ValidationResult;
