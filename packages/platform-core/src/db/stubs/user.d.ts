type StoredUser = Record<string, unknown> & {
    id: string;
    email: string;
};
interface UserWhere extends Partial<StoredUser> {
    NOT?: Partial<StoredUser>;
}
export declare function createUserDelegate(): {
    findUnique({ where }: {
        where: UserWhere;
    }): Promise<StoredUser | null>;
    findFirst({ where }: {
        where: UserWhere;
    }): Promise<StoredUser | null>;
    create({ data }: {
        data: StoredUser;
    }): Promise<StoredUser>;
    update({ where, data, }: {
        where: UserWhere;
        data: Partial<StoredUser>;
    }): Promise<StoredUser>;
};
export {};
