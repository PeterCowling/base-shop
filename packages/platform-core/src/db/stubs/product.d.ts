export type Product = {
    shopId: string;
    id?: string;
    [key: string]: unknown;
};
interface ProductDelegate {
    findMany(args: {
        where: {
            shopId: string;
        };
    }): Promise<Product[]>;
    deleteMany(args: {
        where: {
            shopId: string;
        };
    }): Promise<{
        count: number;
    }>;
    createMany(args: {
        data: Product[];
    }): Promise<{
        count: number;
    }>;
    findUnique(args: {
        where: {
            shopId_id: {
                shopId: string;
                id: string;
            };
        };
    }): Promise<Product | null>;
    update(args: {
        where: {
            shopId_id: {
                shopId: string;
                id: string;
            };
        };
        data: Partial<Product>;
    }): Promise<Product>;
    delete(args: {
        where: {
            shopId_id: {
                shopId: string;
                id: string;
            };
        };
    }): Promise<Product>;
    create(args: {
        data: Product;
    }): Promise<Product>;
}
export declare function createProductDelegate(): ProductDelegate;
export {};
