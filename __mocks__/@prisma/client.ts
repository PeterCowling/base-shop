import { jest } from '@jest/globals';

const editChanges: any[] = [];

class PrismaClient {
  editChange = {
    findMany: jest.fn(async () => [...editChanges]),
    count: jest.fn(async () => editChanges.length),
  };

  inventoryHold = {
    findMany: jest.fn(async () => []),
    update: jest.fn(async (args: any) => args.data),
    delete: jest.fn(async () => ({})),
  };

  inventoryItem = {
    findMany: jest.fn(async () => []),
    update: jest.fn(async (args: any) => args.data),
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  export type InputJsonObject = Record<string, any>;
  export type InputJsonValue = any;
  export type RentalOrderUpdateInput = Record<string, any>;
  export type JsonObject = Record<string, any>;
  export type JsonValue = any;
  export type SortOrder = "asc" | "desc";
}
export { PrismaClient, editChanges as __editChanges };
