import { z } from "zod";
import { localeSchema } from "../Product";
import type { Locale } from "../constants";
export declare const pageComponentSchema: z.ZodTypeAny;
export type PageComponent = z.infer<typeof pageComponentSchema>;
export interface EditorFlags {
    name?: string;
    locked?: boolean;
    zIndex?: number;
    hidden?: ("desktop" | "tablet" | "mobile")[];
    /** Custom device ids (page-defined breakpoints) to hide this node on */
    hiddenDeviceIds?: string[];
    /** Legacy single stacking strategy applied on mobile (kept for backwards-compat). */
    stackStrategy?: "default" | "reverse" | "custom";
    /** Per-device stacking strategies */
    stackDesktop?: "default" | "reverse" | "custom";
    stackTablet?: "default" | "reverse" | "custom";
    stackMobile?: "default" | "reverse" | "custom";
    /** Per-device custom order values (used when the corresponding strategy === "custom") */
    orderDesktop?: number;
    orderTablet?: number;
    /** Per-node custom mobile order (used when stackStrategy = custom on parent) */
    orderMobile?: number;
    /** Builder-only metadata for global (linked) components */
    global?: {
        id: string;
        overrides?: unknown;
        pinned?: boolean;
        /** Per-viewport editing width overrides in the builder (px) */
        editingSize?: Partial<Record<"desktop" | "tablet" | "mobile", number | null>>;
    };
}
export interface HistoryState {
    past: PageComponent[][];
    present: PageComponent[];
    future: PageComponent[][];
    gridCols: number;
    editor?: Record<string, EditorFlags>;
    [key: string]: unknown;
}
export declare const historyStateSchema: z.ZodType<HistoryState>;
export interface Page {
    id: string;
    /** Stable ID used for deterministic code generation */
    stableId?: string;
    slug: string;
    status: "draft" | "published";
    /** Timestamp of the most recent successful publish */
    publishedAt?: string;
    /** User id/email that performed the most recent publish */
    publishedBy?: string;
    /** Optional revision/hash for the last published snapshot */
    publishedRevisionId?: string;
    /** Optional snapshot of the last published components for easy revert */
    lastPublishedComponents?: PageComponent[];
    /** Navigation/Sitemap visibility. Defaults to "public". */
    visibility?: "public" | "hidden";
    components: PageComponent[];
    seo: {
        title: Partial<Record<Locale, string>>;
        description?: Partial<Record<Locale, string>>;
        image?: Partial<Record<Locale, string>>;
        /** When true, exclude from sitemaps and add robots noindex. */
        noindex?: boolean;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    history?: HistoryState;
}
export declare const pageSchema: z.ZodSchema<Page>;
export { localeSchema };
export { scaffoldSpecSchema } from "./ScaffoldSpec";
export type { ScaffoldSpec } from "./ScaffoldSpec";
//# sourceMappingURL=page.d.ts.map