import { type PageComponent } from "@acme/types";

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
export declare function validateComponentRules(components: PageComponent[]): ValidationResult;
