import type { SectionTemplate } from "@acme/types";

export type ValidationResult = {
    ok: true;
} | {
    ok: false;
    errors: string[];
};
export declare function validateSectionRules(sections: SectionTemplate[]): ValidationResult;
