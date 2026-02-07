import { z } from "zod";

import { type PageComponent } from "../page/page";

export type SectionStatus = "draft" | "published";
export interface SectionTemplate {
    id: string;
    label: string;
    status: SectionStatus;
    template: PageComponent;
    tags?: string[];
    thumbnail?: string | null;
    contentWidth?: "full" | "wide" | "normal" | "narrow";
    density?: "compact" | "spacious";
    themeDark?: boolean;
    /** Opt-in minimal scroll animations */
    animateOnScroll?: boolean;
    breakpoints?: {
        id: string;
        label: string;
        min?: number;
        max?: number;
    }[];
    publishAt?: string;
    expireAt?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
export declare const sectionTemplateSchema: z.ZodSchema<SectionTemplate>;
export type { SectionTemplate as SectionTemplateType };
export interface SectionPreset {
    id: string;
    label: string;
    template: PageComponent;
    locked?: string[];
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
export declare const sectionPresetSchema: z.ZodSchema<SectionPreset>;
//# sourceMappingURL=template.d.ts.map