import type { ProductPublication } from "../products/index";
export interface ProductsRepository {
    read<T = ProductPublication>(shop: string): Promise<T[]>;
    write<T = ProductPublication>(shop: string, catalogue: T[]): Promise<void>;
    getById<T extends {
        id: string;
    } = ProductPublication>(shop: string, id: string): Promise<T | null>;
    update<T extends {
        id: string;
        row_version: number;
    } = ProductPublication>(shop: string, patch: Partial<T> & {
        id: string;
    }): Promise<T>;
    delete(shop: string, id: string): Promise<void>;
    duplicate<T extends ProductPublication = ProductPublication>(shop: string, id: string): Promise<T>;
}
