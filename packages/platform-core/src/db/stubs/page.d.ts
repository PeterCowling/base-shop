export type PageRecord = Record<string, unknown>;
type Where = Partial<PageRecord>;
interface PageDelegate {
    createMany(args: {
        data: PageRecord[];
    }): Promise<{
        count: number;
    }>;
    findMany(args?: {
        where?: Where;
    }): Promise<PageRecord[]>;
    update(args: {
        where: Where;
        data: Partial<PageRecord>;
    }): Promise<PageRecord>;
    deleteMany(args: {
        where: Where;
    }): Promise<{
        count: number;
    }>;
    upsert(args: {
        where: Where;
        update: Partial<PageRecord>;
        create: PageRecord;
    }): Promise<PageRecord>;
}
export declare function createPageDelegate(): PageDelegate;
export declare const pageDelegate: PageDelegate;
export {};
