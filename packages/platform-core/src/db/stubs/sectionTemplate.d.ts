export type SectionTemplateRecord = Record<string, unknown>;
type Where = Partial<SectionTemplateRecord>;
interface SectionTemplateDelegate {
    findMany(args?: {
        where?: Where;
    }): Promise<SectionTemplateRecord[]>;
    upsert(args: {
        where: Where;
        update: Partial<SectionTemplateRecord>;
        create: SectionTemplateRecord;
    }): Promise<SectionTemplateRecord>;
    deleteMany(args: {
        where: Where;
    }): Promise<{
        count: number;
    }>;
    update(args: {
        where: Where;
        data: Partial<SectionTemplateRecord>;
    }): Promise<SectionTemplateRecord>;
}
export declare function createSectionTemplateDelegate(): SectionTemplateDelegate;
export declare const sectionTemplateDelegate: SectionTemplateDelegate;
export {};
